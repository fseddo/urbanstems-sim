export default () => {
  return (
    <section className='flex w-full flex-col items-center gap-14 border-y-2 py-40'>
      <header className='font-crimson w-2/3 text-center text-4xl font-medium'>
        Curated for those with an eye for luxury, our bouquets are designed with{' '}
        <span className='italic'>style and sophistication</span> in the heart of
        New York and delivered nationwide.
      </header>
      <div className='hover:text-foreground/60 flex cursor-pointer text-lg font-extrabold tracking-[0.2em] underline underline-offset-6'>
        LEARN MORE
      </div>
    </section>
  );
};
