import { mockJobs } from "@/lib/mock/jobs";
import type { RealtimeEvent, ScraperSource } from "@/types/jobs";

type Listener = (event: RealtimeEvent) => void;

const companies = ["Atlassian", "PhonePe", "Swiggy", "Groww", "Zeta", "Meesho"];
const titles = ["Backend Engineer", "Java Platform Engineer", "Full Stack Developer", "API Engineer"];

export class MockRealtimeClient {
  private listeners = new Set<Listener>();
  private timer?: number;
  private counter = 0;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    if (!this.timer) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size) {
        this.stop();
      }
    };
  }

  private start() {
    this.timer = window.setInterval(() => {
      this.counter += 1;
      const source: ScraperSource = this.counter % 3 === 0 ? "Indeed" : this.counter % 2 === 0 ? "Naukri" : "LinkedIn";
      const newJob = {
        ...mockJobs[this.counter % mockJobs.length],
        id: `live_${Date.now()}`,
        jobTitle: titles[this.counter % titles.length],
        company: companies[this.counter % companies.length],
        source,
        scrapedTime: new Date().toISOString(),
        postedTime: new Date(Date.now() - 90 * 60_000).toISOString(),
        gptRelevanceScore: 80 + (this.counter % 17),
        matchPercentage: 78 + (this.counter % 19),
        status: "UNAPPLIED" as const,
        clickCount: 0,
        isNew: true
      };

      this.emit({ type: "job.created", payload: newJob });
    }, 12_000);
  }

  private stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private emit(event: RealtimeEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}

export const realtimeClient = new MockRealtimeClient();
