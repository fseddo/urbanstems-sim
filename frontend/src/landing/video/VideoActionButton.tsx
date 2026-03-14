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
    borderColor: isHovered ? 'white' : 'transparent',
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
        className='rounded-sm border px-8 py-5 text-base font-extrabold tracking-[2px] opacity-90 shadow-lg'
      >
        {props.label}
      </animated.button>
    </Link>
  );
};
