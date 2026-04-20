export default function AppLink({ to, navigate, onClick, children, ...rest }) {
  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
    }

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      rest.target === '_blank'
    ) {
      return;
    }

    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
