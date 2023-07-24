import React from "react";
import {
  readFileFromIndexedDB,
  useHistoricalFiles,
} from "../../state/historicalFiles";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Trash } from "lucide-react";

const FileArchivePage = () => {
  const files = useHistoricalFiles((state) => state.files);
  const removeFile = useHistoricalFiles((state) => state.removeFile);

  return (
    <div className="flex flex-col w-full h-full p-1 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <Label className="text-lg font-semibold">File Archive</Label>
      </div>
      {files.length > 0 && (
        <ScrollArea>
          {files.map((file, index) => (
            <div
              className="flex items-center justify-between p-3 mb-3 space-x-3 rounded-none"
              key={index}
            >
              <div className="truncate max-w-[200px] md:max-w-[300px] lg:max-w-none">
                {file}
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => removeFile(file)}>
                  <Trash />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          There are no files.
        </div>
      )}
    </div>
  );
};

export default FileArchivePage;
