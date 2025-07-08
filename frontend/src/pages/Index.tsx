import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { button as buttonStyles } from "@heroui/theme";

import Titlebar from "@/components/Titlebar";

export default function IndexPage() {
  return (
    <>
      <Titlebar />
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 w-full h-full">
        <div className="flex gap-3">
          <Input type="file" className="w-64" placeholder="选择数据集" />
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
          >
            上传数据集
          </Link>
        </div>
      </section>
    </>
  );
}
