import { useMemo, useState } from "react";
import {
  Activity,
  AppWindow,
  Cpu,
  HardDrive,
  MemoryStick,
  Search,
  SquareTerminal,
} from "lucide-react";
import type { AppTab } from "../components/SparkleTabBar";

interface TaskManagerProps {
  tabs: AppTab[];
  onEndTask: (tabId: string) => void;
}

const navigation = [
  "Processes",
  "Performance",
  "App history",
  "Startup apps",
  "Users",
  "Details",
  "Services",
];

export function TaskManager({ tabs, onEndTask }: TaskManagerProps) {
  const [activeView, setActiveView] = useState("Processes");
  const [query, setQuery] = useState("");
  const [selectedProcessId, setSelectedProcessId] = useState(tabs[0]?.id ?? "");
  const processes = useMemo(
    () => [
      ...tabs.map((tab, index) => ({
        id: tab.id,
        name: tab.title,
        type: "App",
        cpu: `${(0.1 + ((index * 7) % 18) / 10).toFixed(1)}%`,
        memory: `${Math.round(86 + ((index * 83) % 460))} MB`,
        disk: `${((index * 3) % 12) / 10} MB/s`,
      })),
      {
        id: "shell",
        name: "Sparkle Desktop Window Manager",
        type: "Background process",
        cpu: "1.2%",
        memory: "184 MB",
        disk: "0 MB/s",
      },
      {
        id: "search",
        name: "Sparkle Search",
        type: "Background process",
        cpu: "0.2%",
        memory: "92 MB",
        disk: "0 MB/s",
      },
      {
        id: "widgets",
        name: "Widgets",
        type: "Background process",
        cpu: "0.1%",
        memory: "128 MB",
        disk: "0 MB/s",
      },
    ],
    [tabs],
  );
  const filtered = processes.filter((process) =>
    process.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="h-full min-h-[520px] bg-[#f7f8fa] text-[#202124] dark:bg-[#202124] dark:text-[#f3f3f3] flex overflow-hidden">
      <aside className="w-[190px] shrink-0 border-r border-black/10 dark:border-white/10 p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-3 py-4 font-semibold">
          <Activity className="h-5 w-5 text-blue-600" /> Task Manager
        </div>
        {navigation.map((item, index) => (
          <button
            key={item}
            onClick={() => setActiveView(item)}
            className={`rounded-md px-3 py-2.5 text-left text-sm ${activeView === item ? "bg-blue-600/10 font-medium text-blue-700 dark:text-blue-300" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
          >
            {index === 0 ? (
              <AppWindow className="mr-3 inline h-4 w-4" />
            ) : (
              <SquareTerminal className="mr-3 inline h-4 w-4 opacity-65" />
            )}
            {item}
          </button>
        ))}
      </aside>
      <section className="flex min-w-0 flex-1 flex-col p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{activeView}</h1>
          <div className="flex items-center gap-2">
            <label className="flex h-9 items-center gap-2 rounded-md border border-black/10 bg-white px-3 dark:border-white/15 dark:bg-white/5">
              <Search className="h-4 w-4 opacity-60" />
              <input
                aria-label="Search processes"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name"
                className="w-36 bg-transparent text-sm outline-none placeholder:text-black/45 dark:placeholder:text-white/45"
              />
            </label>
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              disabled={!tabs.some((tab) => tab.id === selectedProcessId)}
              onClick={() => selectedProcessId && onEndTask(selectedProcessId)}
            >
              End task
            </button>
          </div>
        </header>
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { icon: Cpu, label: "CPU", value: "8%" },
            { icon: MemoryStick, label: "Memory", value: "42%" },
            { icon: HardDrive, label: "Disk", value: "2%" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-2 text-xs opacity-65">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <div className="mt-1 text-xl font-semibold">{value}</div>
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-[#f1f3f5] text-xs dark:bg-[#292b30]">
              <tr>
                {["Name", "Status", "CPU", "Memory", "Disk"].map((heading) => (
                  <th
                    key={heading}
                    className="border-b border-black/10 px-4 py-3 font-medium dark:border-white/10"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((process) => (
                <tr
                  key={process.id}
                  onClick={() => setSelectedProcessId(process.id)}
                  className={`cursor-default hover:bg-blue-500/[0.06] ${selectedProcessId === process.id ? "bg-blue-500/[0.08]" : ""}`}
                >
                  <td className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
                    <AppWindow className="mr-2 inline h-4 w-4 text-blue-600" />
                    {process.name}
                  </td>
                  <td className="border-b border-black/[0.06] px-4 py-3 text-xs opacity-60 dark:border-white/[0.06]">
                    {process.type}
                  </td>
                  <td className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
                    {process.cpu}
                  </td>
                  <td className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
                    {process.memory}
                  </td>
                  <td className="border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
                    {process.disk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="mt-3 text-xs opacity-60">
          {processes.length} processes · SparkleOS 27000.01
        </footer>
      </section>
    </main>
  );
}
