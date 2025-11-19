export function GXFooter() {
  return (
    <footer className="px-5 border-t border-neutral-900 pt-6 mt-10  pb-4 text-[0.7rem] text-white font-bold flex flex-wrap justify-between gap-2">
      <p>© {new Date().getFullYear()} Guinness Nigeria. All rights reserved.</p>
      <p className="uppercase tracking-[0.2em]">drink responsibly.</p>
    </footer>
  );
}
