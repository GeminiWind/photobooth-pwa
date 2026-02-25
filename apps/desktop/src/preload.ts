import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("photobooth", {
  listFrames: () => ipcRenderer.invoke("photobooth:listFrames"),
  pickFrameFile: () => ipcRenderer.invoke("photobooth:pickFrameFile"),
  importFrame: (filePath: string) => ipcRenderer.invoke("photobooth:importFrame", filePath),
  deleteFrame: (frameId: string) => ipcRenderer.invoke("photobooth:deleteFrame", frameId),
  savePhoto: (pngBytes: Uint8Array, filenameHint: string) =>
    ipcRenderer.invoke("photobooth:savePhoto", pngBytes, filenameHint),
  getSaveDirectory: () => ipcRenderer.invoke("photobooth:getSaveDirectory")
});
