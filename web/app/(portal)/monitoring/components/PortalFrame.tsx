'use client';

type PortalFrameProps = {
  src: string;
};

export function PortalFrame({ src }: PortalFrameProps) {
  return (
    <main className="portal-main">
      <iframe id="portal-panel" className="portal-panel" src={src} title="Monitoring iframe" loading="lazy" />
    </main>
  );
}
