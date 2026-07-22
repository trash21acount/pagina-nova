type CharacterCounterProps = {
  value: string;
  maxLength: number;
};

export function CharacterCounter({ value, maxLength }: CharacterCounterProps) {
  return <span>{value.length} / {maxLength}</span>;
}
