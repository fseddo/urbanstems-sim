export const Footer = () => {
  return (
    <footer
      className='bg-footer mt-16 border-t transition-[padding-bottom] duration-300'
      style={{ paddingBottom: 'var(--bottom-bar-height)' }}
    >
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <p>&copy; {new Date().getFullYear()} Urban Stems. Fresh flowers delivered daily.</p>
        </div>
      </div>
    </footer>
  );
};
