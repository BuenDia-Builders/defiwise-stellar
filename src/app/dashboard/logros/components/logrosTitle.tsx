interface LogrosTitleProps {
  icon: React.ReactNode;
  title: string;
}

export default function LogrosTitle({ icon, title }: LogrosTitleProps) {
  return (
    <h4 className="flex text-h4 items-center border-b-[1px] border-lightGrey pb-2">
      {icon}
      <span className="ml-2 text-grey">{title}</span>
    </h4>
  );
}
