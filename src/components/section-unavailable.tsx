type SectionUnavailableProps = {
  message: string;
};

export function SectionUnavailable({ message }: SectionUnavailableProps) {
  return (
    <p className="px-4 py-8 text-center text-sm text-muted">{message}</p>
  );
}
