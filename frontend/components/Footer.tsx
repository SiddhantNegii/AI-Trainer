export default function Footer() {
  return (
    <footer className="bg-surface py-20 border-t border-outline-variant/10">
      <div className="px-margin-mobile lg:px-margin-desktop flex flex-col items-center gap-8 text-center">
        <div className="font-headline-md text-headline-md text-primary tracking-widest">
          AI FITNESS TRAINER — TRAIN. TRACK. PROGRESS.
        </div>
        <div className="font-label-caps text-label-caps text-on-surface-variant opacity-60">
          ©{new Date().getFullYear()} AI FITNESS TRAINER. UNCOMPROMISING PRECISION.
        </div>
      </div>
    </footer>
  )
}
