{ pkgs }: {
  deps = [
    pkgs.nodejs   # Node.js
    pkgs.yarn     # si usas yarn, opcional
    pkgs.ffmpeg   # FFmpeg para extracción de audio
    pkgs.python3  # yt-dlp requiere Python
    pkgs.git      # opcional, para clonar repos/repos
    pkgs.curl     # opcional, si necesitás descargas
  ];

  shellHook = ''
    echo "Entorno cargado: Node.js, ffmpeg y yt-dlp listos para usar"
  '';
}
