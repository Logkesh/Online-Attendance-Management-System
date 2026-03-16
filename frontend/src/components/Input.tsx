interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = ({ label, ...props }: Props) => (
  <label className="mb-3 block text-sm text-slate-700">
    <span className="mb-1 block">{label}</span>
    <input
      {...props}
      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
    />
  </label>
);
