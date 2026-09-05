import type { Metadata } from "next";
import Link from "next/link";
import { FictionStoryPlayer } from "@/components/FictionStoryPlayer";
import { NIUDA_FICTION } from "@/lib/fiction-niuda";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "牛大boy · 虚构喜剧 | Onward",
  description: "一个明确标注为虚构的中文网络喜剧彩蛋，不是真实历史人物故事。",
  robots: { index: false, follow: false },
};

export default function NiudaFictionPage() {
  if (process.env.STORY_CREATION_ENABLED?.trim().toLowerCase() === "false") {
    return <main lang="zh-CN" className="mx-auto max-w-[36rem] space-y-5 px-6 py-16">
      <h1 className="text-2xl">故事暂时无法打开。</h1>
      <Link href="/" className="underline">返回 Onward</Link>
      <a href="https://findahelpline.com/" className="block underline">查看危机支持资源</a>
    </main>;
  }
  return <main className="mx-auto max-w-[36rem] px-6 py-16"><FictionStoryPlayer story={NIUDA_FICTION} /></main>;
}
