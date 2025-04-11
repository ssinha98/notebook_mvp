import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "!bg-black !text-white border-gray-700 shadow-lg",
          description: "!text-gray-300",
          actionButton: "!bg-white !text-black hover:!bg-gray-100",
          cancelButton: "!bg-gray-800 !text-gray-300 hover:!bg-gray-700",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
