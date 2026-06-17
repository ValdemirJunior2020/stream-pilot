type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
