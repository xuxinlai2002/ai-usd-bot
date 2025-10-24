export class Recorder {
  private lines: string[] = [];

  log(line: string) {
    this.lines.push(line);
  }

  transcript() {
    return this.lines.join("\n");
  }
}
