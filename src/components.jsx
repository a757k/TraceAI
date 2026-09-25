import {
  Search,
  UserRound,
  Globe,
  Activity,
  MapPin,
  Clock3,
  ShieldAlert,
  Bot,
  ExternalLink,
  LoaderCircle
} from "lucide-react";

export const features = [
  {
    id: "identity",
    title: "Identity Resolution",
    description:
      "Find public pages that may relate to the same name or identifier.",
    icon: UserRound
  },
  {
    id: "profile",
    title: "Public Profile",
    description:
      "Build a structured overview from publicly available sources.",
    icon: Globe
  },
  {
    id: "footprint",
    title: "Digital Footprint",
    description:
      "Explore websites, profiles, mentions and public references.",
    icon: Search
  },
  {
    id: "activity",
    title: "Public Activity",
    description:
      "Organise publicly visible activity and references.",
    icon: Activity
  },
  {
    id: "safety",
    title: "Safety Indicators",
    description:
      "Surface documented public indicators without making personal diagnoses.",
    icon: ShieldAlert
  },
  {
    id: "location",
    title: "Location Clues",
    description:
      "Find publicly exposed location references and clues.",
    icon: MapPin
  },
  {
    id: "timeline",
    title: "Activity Timeline",
    description:
      "Arrange available public information chronologically.",
    icon: Clock3
  },
  {
    id: "ask",
    title: "Ask the Case AI",
    description:
      "Ask questions about the evidence collected in the case.",
    icon: Bot
  }
];

export function FeatureCard({ feature, onClick }) {
  const Icon = feature.icon;

  return (
    <button className="feature-card" onClick={onClick}>
      <div className="feature-icon">
        <Icon size={20} />
      </div>

      <div className="feature-text">
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
    </button>
  );
}

export function ResultCard({ result, onSave }) {
  return (
    <article className="result-card">
      <div className="result-top">
        <div>
          <h3>{result.title}</h3>

          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {result.url}
            <ExternalLink size={13} />
          </a>
        </div>

        <button
          className="save-button"
          onClick={() => onSave(result)}
        >
          Save
        </button>
      </div>

      <p>{result.description}</p>

      {result.age && (
        <span className="result-age">
          {result.age}
        </span>
      )}
    </article>
  );
}

export function Loading({ text = "Searching..." }) {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={20} />
      <span>{text}</span>
    </div>
  );
}
