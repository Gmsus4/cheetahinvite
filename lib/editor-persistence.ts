import { EDITOR_AUTOSAVE_DELAY, EditorSaveFailure, editorDraftPrefix, parseEditorDraft, type EditorDraftRecord, type EditorSaveResult, type EditorWizard } from "@/lib/invitation-editor";
import { redactEditorPin } from "@/lib/invitation-privacy";

type Options = {
  ownerId: string; eventId: string; snapshot: string; version: number; creation: boolean; manualOnly: boolean;
  privacyVersion?: number;
  initialChanges?: { snapshot: string; version: number; privacyVersion?: number; sessionId?: string };
  save(snapshot: string, version: number, automatic: boolean, privacyVersion: number): Promise<EditorSaveResult>;
};
type Browser = { storage: Storage | null; uuid(): string; now(): number; online(): boolean };
export type EditorPersistenceState = {
  ready: boolean; acknowledged: string; saving: boolean; local: boolean; localWarning: boolean; lastSaved: boolean;
  recovery: EditorDraftRecord | null; error: string; code: string; conflictVersion?: number; conflictPrivacyVersion?: number; manualOnly: boolean;
};
const unavailable = (): EditorSaveResult => ({ ok: false, code: "unavailable", message: "No pudimos guardar en el servidor. Tu copia local sigue disponible; intenta de nuevo." });

// Independent of React/browser globals: the same queue handles autosave, explicit
// saves and publication. A stale response can acknowledge only what it submitted.
export class EditorPersistence {
  private state: EditorPersistenceState;
  private serverState: EditorPersistenceState;
  private listeners = new Set<() => void>();
  private browser?: Browser;
  private active = false;
  private initialized = false;
  private snapshot: string;
  private version: number;
  private privacyVersion: number;
  private eventId: string;
  private creationKey = "";
  private recordKey = "";
  private restoredKey?: string;
  private wizard: EditorWizard = { step: 0, activeExtra: null };
  private uploading = false;
  private timer?: ReturnType<typeof setTimeout>;
  private flight?: Promise<EditorSaveResult>;
  private failedSnapshot = "";
  private retryDelay = 10_000;
  private creationComplete = false;

  constructor(private options: Options) {
    this.snapshot = options.initialChanges?.snapshot ?? options.snapshot;
    this.version = options.initialChanges?.version ?? options.version; this.eventId = options.eventId;
    this.privacyVersion = options.initialChanges?.privacyVersion ?? options.privacyVersion ?? 0;
    const conflict = this.version !== options.version || this.privacyVersion !== (options.privacyVersion ?? 0);
    this.state = { ready: false, acknowledged: options.snapshot, saving: false, local: false, localWarning: false, lastSaved: false, recovery: null,
      error: conflict ? "Hay una versión más reciente guardada. Revisa tus cambios antes de publicarlos." : "", code: conflict ? "conflict" : "", manualOnly: options.manualOnly,
      ...(conflict ? { conflictVersion: options.version, conflictPrivacyVersion: options.privacyVersion ?? 0 } : {}) };
    this.serverState = this.state;
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  getServerSnapshot = () => this.serverState;
  getEventId = () => this.eventId;
  getVersion = () => this.version;
  getPrivacyVersion = () => this.privacyVersion;
  getCreationKey = () => this.creationKey;
  private patch(changes: Partial<EditorPersistenceState>) { this.state = { ...this.state, ...changes }; for (const listener of this.listeners) listener(); }
  private clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = undefined; }
  isDirty = () => this.snapshot !== this.state.acknowledged || this.state.code === "conflict";
  shouldWarn = () => this.isDirty() || this.uploading || this.state.saving;

  start(browser: Browser) {
    this.browser = browser; this.active = true;
    if (!this.initialized) {
      this.initialized = true;
      this.creationKey = browser.uuid();
      const prefix = editorDraftPrefix(this.options.ownerId, this.options.creation ? "" : this.options.eventId);
      const creationPrefix = editorDraftPrefix(this.options.ownerId, "");
      this.recordKey = prefix + (this.options.initialChanges?.sessionId ? `preview-${this.options.initialChanges.sessionId}` : browser.uuid());
      // An explicit /show handoff is already the user's selected copy. Keep other
      // tabs' backups, and protect these edits without asking to recover them again.
      if (this.options.initialChanges) {
        let recovery: EditorDraftRecord | null = null;
        try {
          const previous = parseEditorDraft(browser.storage?.getItem(this.recordKey) ?? null, this.options.ownerId, this.eventId, browser.now());
          if (previous && previous.snapshot !== this.snapshot) recovery = { ...previous, key: this.recordKey };
        } catch { this.patch({ localWarning: true }); }
        this.patch({ ready: true, recovery }); this.backup(); this.schedule(); return;
      }
      const records: EditorDraftRecord[] = [];
      try {
        if (!browser.storage) throw new Error("Storage unavailable");
        for (let index = 0; index < browser.storage.length; index++) {
          const key = browser.storage.key(index);
          // After checkout the route changes from creation to editing, but an
          // unsaved creation backup still lives under the original prefix.
          // parseEditorDraft below enforces the exact owner and event match.
          if (!key || (!key.startsWith(prefix) && (this.options.creation || !key.startsWith(creationPrefix)))) continue;
          const record = parseEditorDraft(browser.storage.getItem(key), this.options.ownerId, this.options.creation ? "" : this.options.eventId, browser.now());
          if (record && (!this.options.creation || !this.options.eventId || (record.eventId || record.creationKey) === this.options.eventId)) records.push({ ...record, key });
        }
        records.sort((a, b) => b.updatedAt - a.updatedAt);
        const recovery = records.find(record => record.snapshot !== redactEditorPin(this.state.acknowledged, this.state.acknowledged) || (this.options.creation && record.eventId));
        this.patch({ ready: true, recovery: recovery ?? null });
      } catch { this.patch({ ready: true, localWarning: true }); }
    }
    this.schedule();
  }
  stop() { this.backup(); this.active = false; this.clearTimer(); }

  update(snapshot: string, uploading: boolean, wizard: EditorWizard, manualOnly: boolean) {
    const changed = snapshot !== this.snapshot;
    const uploadChanged = uploading !== this.uploading;
    this.snapshot = snapshot; this.uploading = uploading; this.wizard = wizard;
    if (manualOnly && !this.state.manualOnly) this.patch({ manualOnly: true });
    if (changed && this.state.code === "validation") this.patch({ error: "", code: "" });
    this.backup(); this.schedule();
    if (changed || uploadChanged) this.patch({});
  }
  setEventId(eventId: string) { this.eventId = eventId; this.backup(); }
  backup = () => {
    if (!this.browser || this.state.recovery) return;
    const needed = this.isDirty() || (this.options.creation && this.eventId && !this.creationComplete);
    try {
      if (!this.browser.storage) throw new Error("Storage unavailable");
      if (needed) {
        const record: EditorDraftRecord = { schema: 1, ownerId: this.options.ownerId, eventId: this.eventId, creationKey: this.creationKey, snapshot: redactEditorPin(this.snapshot, this.state.acknowledged), version: this.version, privacyVersion: this.privacyVersion, wizard: this.wizard, updatedAt: this.browser.now() };
        this.browser.storage.setItem(this.recordKey, JSON.stringify(record));
        if (!this.state.local) this.patch({ local: true });
      } else {
        this.browser.storage.removeItem(this.recordKey);
        if (this.state.local) this.patch({ local: false });
      }
    } catch { if (!this.state.localWarning || this.state.local) this.patch({ localWarning: true, local: false }); }
  };
  recover() {
    const record = this.state.recovery;
    if (!record) return null;
    this.restoredKey = record.key;
    this.snapshot = record.snapshot; this.eventId = record.eventId; this.creationKey = record.creationKey; this.wizard = record.wizard;
    const privacyConflict = record.privacyVersion !== undefined && record.privacyVersion !== this.privacyVersion;
    const conflictVersion = record.version !== this.version || privacyConflict ? this.version : undefined;
    const conflictPrivacyVersion = privacyConflict ? this.privacyVersion : undefined;
    this.version = record.version;
    this.privacyVersion = record.privacyVersion ?? this.privacyVersion;
    this.patch({ recovery: null, conflictVersion, conflictPrivacyVersion, code: conflictVersion === undefined ? "" : "conflict", error: conflictVersion === undefined ? "" : "Hay una versión más reciente guardada. Revisa tu copia antes de reemplazarla." });
    this.backup(); this.schedule();
    return record;
  }
  discardRecovery() {
    try { if (this.state.recovery?.key) this.browser?.storage?.removeItem(this.state.recovery.key); }
    catch { this.patch({ localWarning: true }); }
    this.patch({ recovery: null });
  }
  discardChanges() {
    if (this.flight || this.uploading || this.state.recovery) return false;
    this.clearTimer();
    this.snapshot = this.state.acknowledged;
    this.failedSnapshot = "";
    this.patch({ error: "", code: "", conflictVersion: undefined, conflictPrivacyVersion: undefined });
    try { if (this.restoredKey) this.browser?.storage?.removeItem(this.restoredKey); }
    catch { this.patch({ localWarning: true }); }
    this.restoredKey = undefined;
    this.backup();
    return true;
  }
  reportError(message: string) { this.patch({ error: message, code: "unavailable" }); this.backup(); }
  acceptFailure(result: Extract<EditorSaveResult, { ok: false }>) {
    this.patch({ error: result.message, code: result.code, conflictVersion: result.version, conflictPrivacyVersion: result.privacyVersion }); this.backup();
  }

  private schedule() {
    this.clearTimer();
    if (!this.active || !this.state.ready || this.options.creation || this.state.manualOnly || this.uploading || this.flight || this.state.recovery
      || !this.isDirty() || !this.eventId || this.state.code === "conflict" || this.state.code === "auth" || this.state.code === "not-found"
      || (this.state.code === "validation" && this.failedSnapshot === this.snapshot)) return;
    this.timer = setTimeout(() => { void this.saveNow(true); }, this.state.code === "unavailable" ? this.retryDelay : EDITOR_AUTOSAVE_DELAY);
  }
  retry = () => { this.failedSnapshot = ""; this.retryDelay = 10_000; this.schedule(); };

  async saveNow(automatic = false, replaceVersion?: number, replacePrivacyVersion?: number): Promise<EditorSaveResult> {
    this.clearTimer();
    if (this.state.recovery || this.uploading) return { ok: false, code: "validation", message: "Espera a que terminen las fotos y revisa la copia recuperada antes de guardar." };
    if (this.flight) {
      const previous = await this.flight;
      if (!previous.ok || automatic) return previous;
      return this.saveNow(false, replaceVersion, replacePrivacyVersion);
    }
    if (this.state.code === "conflict" && replaceVersion === undefined) return { ok: false, code: "conflict", message: this.state.error, version: this.state.conflictVersion, privacyVersion: this.state.conflictPrivacyVersion };
    if (replaceVersion !== undefined) { this.version = replaceVersion; if (replacePrivacyVersion !== undefined) this.privacyVersion = replacePrivacyVersion; this.patch({ code: "", error: "", conflictVersion: undefined, conflictPrivacyVersion: undefined }); }
    if (automatic && (this.options.creation || this.state.manualOnly)) return { ok: false, code: "published", message: "Guarda los cambios para aplicarlos." };
    if (!this.isDirty() && this.eventId && !this.options.creation && replaceVersion === undefined) return { ok: true, eventId: this.eventId, version: this.version, privacyVersion: this.privacyVersion };
    if (this.browser && !this.browser.online()) {
      this.patch({ code: "unavailable", error: "Estás sin conexión. Tus cambios se conservan en este dispositivo y volveremos a intentar al conectar." });
      this.backup(); return unavailable();
    }
    const submitted = this.snapshot;
    const version = this.version;
    const privacyVersion = this.privacyVersion;
    this.backup(); this.patch({ saving: true, error: "" });
    const flight = Promise.resolve().then(async () => {
      let result: EditorSaveResult;
      try { result = await this.options.save(submitted, version, automatic, privacyVersion); }
      catch (error) { result = error instanceof EditorSaveFailure ? error.result : unavailable(); }
      if (result.ok) {
        this.version = result.version; this.eventId = result.eventId; this.retryDelay = 10_000;
        this.privacyVersion = result.privacyVersion ?? this.privacyVersion;
        this.patch({ acknowledged: submitted, lastSaved: true, code: "", error: "", conflictVersion: undefined, conflictPrivacyVersion: undefined });
        // Remove only this controller's recovered copy, never another tab's backup.
        try { if (this.restoredKey) this.browser?.storage?.removeItem(this.restoredKey); }
        catch { this.patch({ localWarning: true }); }
        this.restoredKey = undefined;
        this.backup();
        if (this.options.creation && !this.isDirty()) {
          this.creationComplete = true;
          try { this.browser?.storage?.removeItem(this.recordKey); this.patch({ local: false }); }
          catch { this.patch({ localWarning: true }); }
        }
      } else {
        this.failedSnapshot = submitted;
        this.patch({ error: result.message, code: result.code, conflictVersion: result.version, conflictPrivacyVersion: result.privacyVersion, ...(result.code === "published" ? { manualOnly: true } : {}) });
        if (result.code === "unavailable") this.retryDelay = Math.min(60_000, this.retryDelay * 2);
        this.backup();
      }
      return result;
    }).finally(() => { this.flight = undefined; this.patch({ saving: false }); this.schedule(); });
    this.flight = flight;
    const result = await flight;
    // Typing during an autosave is allowed. An explicit save must flush the newer
    // values too before preview/publication is allowed to navigate away.
    if (!automatic && result.ok && this.isDirty()) return this.saveNow(false);
    return result;
  }
}
