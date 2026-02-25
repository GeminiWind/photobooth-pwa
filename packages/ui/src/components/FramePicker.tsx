import type { FrameTemplate } from "@photobooth/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

type Props = {
  frames: FrameTemplate[];
  selectedFrameId?: string;
  onSelect: (frameId: string) => void;
  onImport: () => void;
  onDelete: (frameId: string) => void;
};

export function FramePicker({ frames, selectedFrameId, onSelect, onImport, onDelete }: Props) {
  return (
    <section className="panel frame-picker">
      <div className="frame-picker-header">
        <h2>Frames</h2>
      </div>
      <div className="frame-grid">
        {frames.map((frame) => (
          <div key={frame.id} className={frame.id === selectedFrameId ? "frame-card active" : "frame-card"}>
            {frame.source === "user" && (
              <button
                type="button"
                className="frame-delete-button"
                onClick={() => onDelete(frame.id)}
                aria-label={`Delete ${frame.name}`}
                title="Delete imported frame"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
            <button className="frame-select-button" onClick={() => onSelect(frame.id)} type="button">
              <img src={frame.previewPathOrUrl ?? frame.frameImagePathOrUrl} alt={frame.name} />
              <span>{frame.name}</span>
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onImport} className="frame-import-button">
        Import frame
      </button>
    </section>
  );
}
