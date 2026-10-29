import Image from "next/image";
import { FiArrowDown } from "react-icons/fi";
import type { WeddingDesign, weddingArtwork } from "@/lib/wedding-designs";

export type CoverProps = {
  kind: WeddingDesign["kind"]; title: string; names: string[]; date: string;
  time: string; venue: string; imageUrl: string; art: ReturnType<typeof weddingArtwork>;
};

function Names({ title, names, className = "" }: Pick<CoverProps, "title" | "names"> & { className?: string }) {
  return <h1 className={`wc-cover-names ${className}`} aria-label={title}>{names.length === 2 ? <><span className="wc-name">{names[0]}</span><i className="wc-name-join" aria-hidden="true">y</i><span className="wc-name">{names[1]}</span></> : <span className="wc-name">{title}</span>}</h1>;
}

function Portrait({ src, title, className = "" }: { src: string; title: string; className?: string }) {
  return <div className={`wc-cover-photo ${className}`}><Image src={src} alt={`La pareja: ${title}`} fill loading="eager" fetchPriority="high" sizes="(max-width: 760px) 92vw, 55vw" unoptimized /></div>;
}

function Art({ src, className }: { src?: string; className: string }) {
  return src ? <Image src={src} alt="" className={`wc-cover-art ${className}`} width={500} height={700} unoptimized /> : null;
}

function DateLine({ date, time }: Pick<CoverProps, "date" | "time">) {
  return <div className="wc-cover-date"><span>{date}</span>{time && <span>{time}</span>}</div>;
}

function Discover({ children = "Descubre nuestro día" }: { children?: string }) {
  return <a className="wc-cover-discover" href="#wedding-celebration"><span>{children}</span><FiArrowDown aria-hidden="true" /></a>;
}

function FineOrnament() {
  return <svg className="wc-fine-ornament" viewBox="0 0 180 24" fill="none" aria-hidden="true"><path d="M0 12h70m40 0h70M76 12l14-8 14 8-14 8-14-8Z"/><path d="M86 12h8"/></svg>;
}

function CoutureBow() {
  return <svg className="wc-couture-bow" viewBox="0 0 520 210" fill="none" aria-hidden="true">
    <defs><linearGradient id="wc-ribbon" x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".04"/><stop offset=".5" stopColor="currentColor" stopOpacity=".24"/><stop offset="1" stopColor="currentColor" stopOpacity=".06"/></linearGradient></defs>
    <path d="M0 90c85 15 160-6 247-3m26 0c87-3 162 18 247 3" stroke="currentColor" strokeWidth="1"/>
    <path d="M251 90C216 49 139 13 128 46c-12 36 65 70 123 44Z" fill="url(#wc-ribbon)" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M269 90c35-41 112-77 123-44 12 36-65 70-123 44Z" fill="url(#wc-ribbon)" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M249 90c-33 35-69 57-79 98l27-9 9 21c2-48 33-72 50-103m15-7c33 35 69 57 79 98l-27-9-9 21c-2-48-33-72-50-103" fill="url(#wc-ribbon)" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M245 83c8-6 22-6 30 0l-2 20c-8 5-18 5-26 0l-2-20Z" fill="var(--wc-paper)" stroke="currentColor"/>
    <path d="M134 48c34 0 77 26 111 40m141-40c-34 0-77 26-111 40M174 187c11-32 46-60 75-90m97 90c-11-32-46-60-75-90" stroke="currentColor" strokeOpacity=".4" strokeWidth=".7"/>
  </svg>;
}

function SolarEmblem() {
  return <svg className="wc-solar-emblem" viewBox="0 0 180 180" fill="none" aria-hidden="true"><circle cx="90" cy="90" r="30"/><circle cx="90" cy="90" r="38"/>{Array.from({length:24},(_,i)=><path key={i} d={`M90 ${i%2?40:32}V${i%2?24:12}`} transform={`rotate(${i*15} 90 90)`}/>)}</svg>;
}

function TravelSeal() {
  return <svg className="wc-travel-seal" viewBox="0 0 150 150" fill="none" aria-hidden="true"><circle cx="75" cy="75" r="65"/><circle cx="75" cy="75" r="57" strokeDasharray="1 5"/><path d="m75 36 8 31 31 8-31 8-8 31-8-31-31-8 31-8 8-31Z"/><path d="m75 58 4 13 13 4-13 4-4 13-4-13-13-4 13-4 4-13Z"/><path d="M75 14v10m0 102v10M14 75h10m102 0h10"/></svg>;
}

function DecoGeometry() {
  return <svg className="wc-deco-geometry" viewBox="0 0 1000 720" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M24 110h68V30h816v80h68v500h-68v80H92v-80H24V110Z"/><path d="M38 124h68V44h788v80h68v472h-68v80H106v-80H38V124Z"/><path d="M0 80h62V0m876 0v80h62M0 640h62v80m876 0v-80h62"/><path d="m450 30 50 42 50-42M450 690l50-42 50 42"/></svg>;
}

function CelestialMap() {
  return <svg className="wc-cover-celestial-map" viewBox="0 0 640 640" fill="none" aria-hidden="true"><circle cx="320" cy="320" r="286"/><circle cx="320" cy="320" r="254"/><ellipse cx="320" cy="320" rx="190" ry="286" transform="rotate(32 320 320)"/><path d="M34 320h572M320 34v572" strokeDasharray="2 10"/><path d="m124 198 70-33 44 72 79-13m34 213 72-20 36-85 50 24"/>{[[124,198],[194,165],[238,237],[317,224],[351,437],[423,417],[459,332],[509,356]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor"/>)}<path d="m320 15 5 14 14 5-14 5-5 14-5-14-14-5 14-5 5-14Zm0 572 5 14 14 5-14 5-5 14-5-14-14-5 14-5 5-14Z" fill="currentColor"/>{Array.from({length:36},(_,i)=><path key={i} d="M320 34v10" transform={`rotate(${i*10} 320 320)`}/>)}</svg>;
}

export function CollectionCover(p: CoverProps) {
  const {kind,title,names,date,time,venue,imageUrl,art}=p;
  if(kind === "floral") return <header className={`wc-cover wc-floral-cover${imageUrl?" has-photo":""}`}>
    <span className="wc-cover-marginal wc-floral-marginal">EL AMOR ESTÁ EN LOS DETALLES</span>
    <div className="wc-floral-arch"><div className="wc-floral-stems" aria-hidden="true"><Art src={art.topLeft} className="wc-floral-vine left"/><Art src={art.bottomRight} className="wc-floral-vine right"/></div>
      <div className="wc-cover-copy"><span className="wc-cover-kicker">JUNTO A LAS PERSONAS QUE MÁS QUEREMOS</span><Names title={title} names={names}/><FineOrnament/><p className="wc-cover-script">Un día nuestro. Un recuerdo de todos.</p><DateLine date={date} time={time}/></div>
      {imageUrl&&<Portrait src={imageUrl} title={title} className="wc-floral-landscape"/>}
      <Discover>El jardín de nuestro sí</Discover>
    </div><span className="wc-cover-marginal wc-floral-last">UNA VIDA PARA FLORECER JUNTOS</span>
  </header>;
  if(kind === "editorial") return <header className={`wc-cover wc-editorial-cover${imageUrl?" has-photo":""}`}>
    <div className="wc-editorial-masthead"><span>UNA HISTORIA PARA SIEMPRE</span><span>NUESTRA BODA</span></div>
    <div className="wc-editorial-stage"><div className="wc-editorial-title"><span className="wc-cover-kicker">LA VIDA, EN PRIMERA PERSONA</span><Names title={title} names={names}/></div>
      {imageUrl?<Portrait src={imageUrl} title={title} className="wc-editorial-portrait"/>:<div className="wc-editorial-type-art" aria-hidden="true">La vida<br/><em>juntos.</em></div>}
      <div className="wc-editorial-note"><p>Hay días que<br/>cambian una vida.<br/><em>Este es el nuestro.</em></p><DateLine date={date} time={time}/><Discover>Abre nuestro capítulo</Discover></div>
      <span className="wc-editorial-handwriting" aria-hidden="true">Para siempre.</span>
    </div><div className="wc-editorial-running"><span>{venue||"UN ENCUENTRO PARA RECORDAR"}</span><span>EL MEJOR CAPÍTULO EMPIEZA AQUÍ</span></div>
  </header>;
  if(kind === "minimal") return <header className={`wc-cover wc-couture-cover${imageUrl?" has-photo":""}`}>
    <div className="wc-couture-paper"><CoutureBow/><span className="wc-cover-kicker">LA BELLEZA DE ELEGIRNOS</span><Names title={title} names={names}/><span className="wc-couture-rule" aria-hidden="true"/><DateLine date={date} time={time}/>
      {imageUrl&&<Portrait src={imageUrl} title={title} className="wc-couture-portrait"/>}<p className="wc-cover-script">Todo lo que importa, contigo.</p><Discover>Estás invitado</Discover>
    </div><span className="wc-couture-footer" aria-hidden="true">CON AMOR · PARA SIEMPRE</span>
  </header>;
  if(kind === "garden") return <header className={`wc-cover wc-garden-cover${imageUrl?" has-photo":""}`}>
    <div className="wc-garden-envelope"><div className="wc-garden-envelope-back" aria-hidden="true"/>
      <div className="wc-garden-letter wc-cover-copy"><Art src={art.topLeft} className="wc-garden-botanical"/><span className="wc-garden-letter-caption">Una cita entre flores</span><span className="wc-cover-kicker">RESERVA UN LUGAR EN TU CALENDARIO</span><Names title={title} names={names}/><FineOrnament/><DateLine date={date} time={time}/><Discover>Nos vemos en el jardín</Discover></div>
      {imageUrl&&<figure className="wc-garden-memory"><Portrait src={imageUrl} title={title}/><figcaption>Lo bonito de coincidir.</figcaption><Art src={art.flower} className="wc-garden-pressed-flower"/></figure>}
      <div className="wc-garden-envelope-fold" aria-hidden="true"/><span className="wc-garden-envelope-note" aria-hidden="true">Para nuestras personas favoritas.</span>
    </div>
  </header>;
  if(kind === "blossom") return <header className={`wc-cover wc-blossom-cover${imageUrl?" has-photo":""}`}>
    <span className="wc-blossom-spine" aria-hidden="true">UNA NUEVA PRIMAVERA · UNA VIDA JUNTOS</span><Art src={art.topLeft} className="wc-blossom-canopy"/>
    <div className="wc-blossom-copy wc-cover-copy"><span className="wc-cover-kicker">DONDE FLORECE EL AMOR</span><Names title={title} names={names}/><FineOrnament/><p className="wc-cover-script">Contigo, todo florece.</p><DateLine date={date} time={time}/><Discover>Celebra con nosotros</Discover></div>
    <figure className="wc-blossom-window">{imageUrl?<Portrait src={imageUrl} title={title}/>:<Art src={art.flower} className="wc-blossom-flower-center"/>}<span className="wc-blossom-window-orbit" aria-hidden="true"/><Art src={art.flower} className="wc-blossom-window-flower"/><figcaption>El comienzo de nuestra primavera.</figcaption></figure>
    <span className="wc-blossom-petal one" aria-hidden="true"/><span className="wc-blossom-petal two" aria-hidden="true"/><span className="wc-blossom-petal three" aria-hidden="true"/>
  </header>;
  if(kind === "bougainvillea") return <header className={`wc-cover wc-bougainvillea-cover${imageUrl?" has-photo":""}`}>
    <svg className="wc-silk-wave" viewBox="0 0 1400 800" preserveAspectRatio="none" aria-hidden="true"><path d="M0 580C250 780 430 510 680 630S1110 820 1400 450V800H0Z"/><path d="M0 640C300 810 570 570 800 690S1160 760 1400 560"/><path d="M0 690C300 830 540 670 840 735S1180 680 1400 625"/></svg>
    <Art src={art.topLeft} className="wc-boug-corner"/><div className="wc-boug-copy wc-cover-copy"><span className="wc-cover-kicker">CON EL CORAZÓN Y LAS PUERTAS ABIERTAS</span><Names title={title} names={names}/><FineOrnament/><p className="wc-cover-script">La fiesta empieza contigo.</p><DateLine date={date} time={time}/><Discover>Bienvenido a nuestra boda</Discover></div>
    <div className="wc-boug-keepsake">{imageUrl?<Portrait src={imageUrl} title={title}/>:<div className="wc-boug-no-photo"><Art src={art.flower} className="wc-boug-center-flower"/><span>Un amor<br/>para celebrar.</span></div>}<Art src={art.flower} className="wc-boug-bouquet"/><span className="wc-boug-paper-tag">Nuestro recuerdo favorito<br/><em>está por llegar.</em></span></div>
  </header>;
  if(kind === "sunlight") return <header className={`wc-cover wc-sunlight-cover${imageUrl?" has-photo":""}`}>
    <SolarEmblem/><div className="wc-sunlight-scene">{imageUrl&&<figure className="wc-sunlight-memory"><Portrait src={imageUrl} title={title}/><figcaption>Los días más bonitos son contigo.</figcaption></figure>}
      <div className="wc-sunlight-card wc-cover-copy"><Art src={art.topLeft} className="wc-sunlight-flowers"/><span className="wc-cover-kicker">UN DÍA LLENO DE LUZ</span><Names title={title} names={names}/><FineOrnament/><p className="wc-cover-script">La alegría se comparte.</p><DateLine date={date} time={time}/><Discover>Comparte nuestro día</Discover></div>
      <Art src={art.flower} className="wc-sunlight-pressed-flower"/>
    </div><span className="wc-cover-marginal">SOL, FLORES Y NUESTRAS PERSONAS FAVORITAS</span>
  </header>;
  if(kind === "mediterranean") return <header className={`wc-cover wc-travel-cover${imageUrl?" has-photo":""}`}>
    <div className="wc-travel-heading"><span>UNA CELEBRACIÓN PARA RECORDAR</span><span>DESTINO: NUESTRO SÍ</span></div>
    <div className="wc-travel-ticket"><div className="wc-travel-ticket-main"><TravelSeal/><span className="wc-cover-kicker">ESTÁS INVITADO A NUESTRA MEJOR AVENTURA</span><Names title={title} names={names}/><div className="wc-travel-details"><div><small>FECHA DE ENCUENTRO</small><span>{date}</span></div>{time&&<div><small>HORA</small><span>{time}</span></div>}<div className="wc-travel-destination"><small>NUESTRO DESTINO</small><span>{venue||"Un lugar para celebrar juntos"}</span></div></div><p className="wc-cover-script">El mejor destino es encontrarnos.</p></div>
      {imageUrl&&<div className="wc-travel-photo-wrap"><Portrait src={imageUrl} title={title}/><span className="wc-travel-photo-label">UN VIAJE PARA TODA LA VIDA</span></div>}
      <div className="wc-travel-ticket-stub"><span>PARA: NUESTRAS PERSONAS FAVORITAS</span><Discover>Nos vemos aquí</Discover></div>
    </div><svg className="wc-travel-route" viewBox="0 0 680 65" fill="none" aria-hidden="true"><path d="M0 36c110-85 142 62 262-7S432 6 421 31s80 35 259-18" strokeDasharray="3 6"/><path d="m654 9 26 4-22 16 5-12-9-8Z"/></svg>
  </header>;
  if(kind === "art-deco") return <header className={`wc-cover wc-deco-cover${imageUrl?" has-photo":""}`}>
    <DecoGeometry/><div className="wc-deco-copy wc-cover-copy"><span className="wc-deco-jewel" aria-hidden="true"/><span className="wc-cover-kicker">UNA NOCHE EXTRAORDINARIA</span><Names title={title} names={names}/><FineOrnament/><p className="wc-deco-invitation">El honor de celebrar juntos.</p><DateLine date={date} time={time}/><Discover>Acompáñanos</Discover></div>
    {imageUrl&&<figure className="wc-deco-portrait"><Portrait src={imageUrl} title={title}/><figcaption>El comienzo de nuestro siempre.</figcaption></figure>}
    <span className="wc-deco-corner-script" aria-hidden="true">Una noche.<br/>Toda una vida.</span>
  </header>;
  return <header className={`wc-cover wc-celestial-cover${imageUrl?" has-photo":""}`}>
    <div className="wc-celestial-heading"><span>NOS ENCONTRAMOS</span><span aria-hidden="true">✧</span><span>BAJO EL MISMO CIELO</span></div>
    <div className="wc-celestial-copy wc-cover-copy"><span className="wc-cover-kicker">EL UNIVERSO NOS ENCONTRÓ</span><Names title={title} names={names}/><p className="wc-cover-script">De todas las estrellas,<br/>elegimos coincidir.</p><DateLine date={date} time={time}/><Discover>Comparte nuestra noche</Discover></div>
    <div className="wc-celestial-scene"><CelestialMap/><Image className="wc-celestial-moon" src="/celestial/full-moon.png" alt="" width={420} height={420} unoptimized/><span className="wc-celestial-caption" aria-hidden="true">UN ENCUENTRO · UN COMIENZO · NUESTRO SIEMPRE</span></div>
    {imageUrl&&<figure className="wc-celestial-memory"><Portrait src={imageUrl} title={title}/><figcaption>Lo mejor de esta historia<br/><em>es compartirla.</em></figcaption></figure>}
  </header>;
}
