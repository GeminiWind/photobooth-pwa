import type { FrameTemplate } from "@photobooth/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

type Props = {
  frames: FrameTemplate[];
  selectedFrameId?: string;
  onSelect: (frameId: string) => void;
  onImport: () => void;
  onDelete: (frameId: string) => void;
};

export function FramePicker({ frames, selectedFrameId, onSelect, onImport, onDelete }: Props) {
  return (
    <section className="grid h-full min-h-0 max-h-[90vh] grid-rows-[auto_1fr_auto] gap-5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 py-1">
        <h2 className="m-0 text-[1.15rem] font-bold">Select Frame</h2>
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-violet-400">
          {frames.length} styles
        </span>
      </div>

      <div className="frame-picker-scroll flex min-h-0 flex-row gap-[14px] overflow-x-auto overflow-y-hidden pr-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
        {frames.map((frame) => {
          const active = frame.id === selectedFrameId;

          return (
            <article
              key={frame.id}
              className={`group relative w-[198px] shrink-0 rounded-[24px] border-2 p-[10px] transition hover:-translate-y-px lg:w-full lg:max-w-[189px] ${
                active
                  ? "border-[#7f0df2] bg-[#7f0df214]"
                  : "border-transparent bg-[rgba(20,30,59,0.75)]"
              }`}
            >
              {frame.source === "user" && (
                <button
                  type="button"
                  className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-[rgba(7,10,27,0.82)] p-0 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                  onClick={() => onDelete(frame.id)}
                  aria-label={`Delete ${frame.name}`}
                  title="Delete imported frame"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}

              <button
                className="grid w-full gap-2.5 bg-transparent p-0 text-left text-inherit"
                onClick={() => onSelect(frame.id)}
                type="button"
              >
                <span className="block aspect-[2/3] overflow-hidden rounded-2xl border border-slate-400/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0)),#1f2a40]">
                  <img
                    src={frame.previewPathOrUrl ?? frame.frameImagePathOrUrl}
                    alt={frame.name}
                    className="block h-full w-full object-cover"
                  />
                </span>
                <span className="block text-[0.95rem] text-slate-100">{frame.name}</span>
              </button>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onImport}
        className="mb-6 flex min-h-[66px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-[#7f0df2b3] bg-[#7f0df20a] text-[#7f0df2] transition hover:bg-[#7f0df214] lg:mb-6"
      >
        <span className="grid size-[22px] place-items-center rounded-full border border-current">
          <FontAwesomeIcon icon={faPlus} />
        </span>
        <span>Add New Frame</span>
      </button>
    </section>
  );
}
