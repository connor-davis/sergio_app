import React from "react";
import { useHistoricalFiles } from "../../state/historicalFiles";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Trash } from "lucide-react";

const FileArchivePage = () => {
  const files = useHistoricalFiles((state) =>
    Object.values(state.files).map((file, index) => {
      return {
        content: file,
        name: Object.keys(state.files)[index],
      };
    })
  );
  const removeFile = useHistoricalFiles((state) => state.removeFile);

  function byteLength(str) {
    // returns the byte length of an utf8 string
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s += 2;
      if (code >= 0xdc00 && code <= 0xdfff) i--; //trail surrogate
    }
    return s;
  }

  const units = [
    "bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  function niceBytes(x) {
    let l = 0,
      n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
      n = n / 1024;
    }

    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
  }

  return (
    <div className="flex flex-col w-full h-full p-1 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <Label className="text-lg font-semibold">File Archive</Label>
      </div>
      <ScrollArea>
        {files.map((file, index) => (
          <div
            className="flex items-center justify-between p-3 mb-3 space-x-3 rounded-none"
            key={index}
          >
            <div className="truncate max-w-[200px] md:max-w-[300px] lg:max-w-none">
              {file.name}
            </div>
            <div className="flex items-center space-x-3">
              <div>{niceBytes(byteLength(file.content))}</div>
              <Button variant="ghost" onClick={() => removeFile(file.name)}>
                <Trash />
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default FileArchivePage;
