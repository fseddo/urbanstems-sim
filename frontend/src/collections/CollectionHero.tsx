import type { Tag } from '@/api/tags/Tag';

type Props = {
  pageTag: Tag | null;
  searchTerm: string | undefined;
};

// The title-and-subtitle block above the listing header bar. Three render
// paths: a Tag-backed landing page (Tag's header_title + header_subtitle), a
// search results page ("Results for ..."), or the catch-all "Shop All" copy.

export const CollectionHero = ({ pageTag, searchTerm }: Props) => {
  return (
    <header className='font-crimson flex flex-col items-center justify-center gap-2 py-18 text-[40px]'>
      <span className='flex flex-col items-center gap-4'>
        {!pageTag ? (
          searchTerm ? (
            <span className='text-5xl'>{`Results for "${searchTerm}"`}</span>
          ) : (
            <>
              <span className='text-5xl'>Shop All</span>
              <span className='font-mulish text-center text-base'>
                The flowers and gifts designed in-house with style and
                sophistication.
              </span>
            </>
          )
        ) : (
          <>
            <span className='text-5xl'>{pageTag.header_title}</span>
            <span className='font-mulish text-center text-base'>
              {pageTag.header_subtitle}
            </span>
          </>
        )}
      </span>
    </header>
  );
};
