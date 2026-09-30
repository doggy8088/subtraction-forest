export default function FoxFace({ small = false }: { small?: boolean }) {
  return (
    <span className={`fox-face ${small ? 'small' : ''}`} aria-hidden="true">
      <i className="ear left" />
      <i className="ear right" />
      <i className="cheek left" />
      <i className="cheek right" />
      <i className="eye left" />
      <i className="eye right" />
      <i className="nose" />
    </span>
  );
}
