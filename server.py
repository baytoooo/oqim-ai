"""OQIM static server with byte ranges for correct browser video seeking."""
import argparse, functools, os, re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        path=self.translate_path(self.path)
        raw=self.headers.get('Range')
        if not raw or not os.path.isfile(path):
            return super().send_head()
        size=os.path.getsize(path)
        match=re.fullmatch(r'bytes=(\d*)-(\d*)',raw)
        if not match:
            self.send_error(416);return None
        first,last=match.groups()
        start=int(first) if first else max(0,size-int(last or 0))
        end=min(size-1,int(last) if first and last else size-1)
        if start>end or start>=size:
            self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return None
        self.send_response(206)
        self.send_header('Content-Type',self.guess_type(path))
        self.send_header('Content-Length',str(end-start+1))
        self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.send_header('Accept-Ranges','bytes');self.end_headers()
        self._remaining=end-start+1
        file=open(path,'rb');file.seek(start);return file
    def copyfile(self,source,output):
        remaining=getattr(self,'_remaining',None)
        if remaining is None:return super().copyfile(source,output)
        while remaining:
            data=source.read(min(65536,remaining))
            if not data:break
            output.write(data);remaining-=len(data)
        self._remaining=None
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        super().end_headers()
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8872);args=parser.parse_args()
    directory=str(Path(__file__).resolve().parent/'dist')
    print(f'OQIM AI: http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),functools.partial(Handler,directory=directory)).serve_forever()
