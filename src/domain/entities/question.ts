export class Question {
  id: string;
  text: string;
  media?: string;
  mediaType?: 'image' | 'video' | 'audio';
  options?: string[];
  correctAnswers: string[];
  type: 'multiple-choice' | 'text' | 'true/false';
  points: number;

  constructor(
    id: string,
    text: string,
    correctAnswers: string[],
    type: 'multiple-choice' | 'text' | 'true/false',
    points: number,
    media?: string,
    mediaType?: 'image' | 'video' | 'audio',
    options?: string[]
  ) {
    this.id = id;
    this.text = text;
    this.correctAnswers = correctAnswers;
    this.type = type;
    this.points = points;
    this.media = media;
    this.mediaType = mediaType;
    this.options = options;
  }

  validateAnswer(answer: string): boolean {
    const normalizedAnswer = answer.trim().toLowerCase();
    return this.correctAnswers.some(
      (correct) => correct.trim().toLowerCase() === normalizedAnswer
    );
  }

  randomizeOptions(): void {
    if (this.options) {
      const shuffledOptions = [...this.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [
          shuffledOptions[j],
          shuffledOptions[i],
        ];
      }
      this.options = shuffledOptions;
    }
  }
}
