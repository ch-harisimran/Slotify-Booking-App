import { initials } from '../lib/format';

/**
 * The user's profile picture — or their initials on the accent gradient
 * circle when no picture is set. Used wherever the app shows "the user's
 * avatar": the profile page and the Navbar, so a photo set on one shows up
 * on the other automatically (both just read profile.avatar_url/name from
 * AuthContext). `className` should include one of avatar-sm/avatar-lg (or
 * neither, for the default size) same as the plain .avatar div did.
 */
export default function Avatar({ url, name, email, className = '', ...rest }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || 'Profile'}
        className={`avatar avatar-photo ${className}`.trim()}
        {...rest}
      />
    );
  }
  return (
    <div className={`avatar ${className}`.trim()} {...rest}>
      {initials(name, email)}
    </div>
  );
}
