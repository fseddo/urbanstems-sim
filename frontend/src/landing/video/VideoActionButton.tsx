import { useSpring, animated } from '@react-spring/web';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';

export const VideoActionButton = (props: {
  onClick?: () => void;
  label: string;
  href: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const springProps = useSpring({
    backgroundColor: isHovered ? 'transparent' : 'white',
    borderColor: isHovered ? 'white' : 'brand-primary',
    color: isHovered ? 'white' : 'black',
    config: { tension: 100, friction: 10 },
  });

  return (
    <Link to={props.href}>
      <animated.button
        onClick={props.onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={springProps}
        className='rounded-sm border px-7 py-4 text-sm font-bold tracking-[1px] opacity-90 shadow-lg'
      >
        {props.label}
      </animated.button>
    </Link>
  );
};
