import Image from "next/image";
import { FiArrowDown } from "react-icons/fi";
import type { weddingArtwork } from "@/lib/wedding-designs";

type Artwork = ReturnType<typeof weddingArtwork>;

export function LoveLetterCover({ title, names, date, time, artwork }: { title: string; names: string[]; date: string; time: string; artwork: Artwork }) {
  return <div className="love-envelope">
    <div className="love-letter-sheet">
      <div className="love-letter-corners" aria-hidden="true">
        {artwork.topLeft && <Image className="love-letter-top" src={artwork.topLeft} width={220} height={278} alt="" unoptimized />}
        {artwork.bottomRight && <Image className="love-letter-bottom" src={artwork.bottomRight} width={240} height={168} alt="" unoptimized />}
      </div>
      <div className="wedding-hero-copy love-letter-copy">
        <p className="love-salutation">Con todo nuestro amor,</p>
        <span className="wedding-eyebrow">UNA CARTA PARA TI</span>
        <h1 aria-label={title}>{names.length === 2 ? <><span>{names[0]}</span><i aria-hidden="true">&amp;</i><span>{names[1]}</span></> : <span>{title}</span>}</h1>
        <p className="love-letter-invitation">Hay un nuevo capítulo en nuestra historia.<br />Y queremos escribirlo contigo.</p>
        <div className="love-letter-date"><span>{date}</span>{time && <span>{time}</span>}</div>
        <a className="wedding-button" href="#wedding-celebration">Lee nuestra carta <FiArrowDown aria-hidden="true" /></a>
      </div>
    </div>
    <div className="love-envelope-pocket" aria-hidden="true" />
    {artwork.flower && <Image className="love-wax-seal" src={artwork.flower} width={104} height={108} alt="" unoptimized />}
  </div>;
}

export function LoveLetterMemory({ src, title, butterfly }: { src: string; title: string; butterfly?: string }) {
  return <div className="love-memory">
    <figure className="love-memory-photo"><div><Image src={src} alt={`La pareja: ${title}`} fill sizes="(max-width: 760px) 85vw, 38vw" unoptimized /></div><figcaption>Nuestro para siempre</figcaption></figure>
    <div className="love-memory-note">{butterfly && <Image src={butterfly} width={90} height={90} alt="" unoptimized />}<p>Hay historias<br />que se escriben<br />con el corazón.</p><span aria-hidden="true">♡</span></div>
  </div>;
}

export function LoveLetterClosing({ artwork }: { artwork: Artwork }) {
  return <div className="love-closing-corners" aria-hidden="true">{artwork.topRight && <Image src={artwork.topRight} className="love-closing-top" width={210} height={149} alt="" unoptimized />}{artwork.bottomLeft && <Image src={artwork.bottomLeft} className="love-closing-bottom" width={180} height={222} alt="" unoptimized />}</div>;
}
