import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  text,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  text?: string;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <Reveal className={`mb-10 md:mb-14 ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-display text-[2rem] leading-[1.05] font-extrabold tracking-tight text-balance md:text-5xl">
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </h2>
      <div className={`rainbow-line mt-5 ${center ? "mx-auto" : ""}`} />
      {text && <p className="mt-5 text-base text-pretty text-mute md:text-lg">{text}</p>}
    </Reveal>
  );
}
