import { Link } from 'react-router-dom';

export default function AppLink({ to, onClick, children, ...rest }) {
  return (
    <Link to={to} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
