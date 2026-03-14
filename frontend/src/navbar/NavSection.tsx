import { NavSectionItem } from './Navbar';

export const NavSection = (props: { items: NavSectionItem[] }) => {
  return (
    <div className='font-crimson text-brand-primary hidden gap-[clamp(18px,15.3vw,19px)] text-sm text-[clamp(13px,1.2vw,18px)] lg:flex'>
      {props.items.map(({ label, Icon }) => (
        <div className={'flex items-center gap-1.5'}>
          {/* this parent div should only exist if there is an icon */}
          <div>{label}</div>
          {Icon && <Icon size={13} />}
        </div>
      ))}
    </div>
  );
};
