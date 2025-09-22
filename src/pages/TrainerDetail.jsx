import React from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

// Mock data trainers (đồng bộ với Home.jsx)
const trainers = [
  {
    id: "101",
    avatar: "/img/team-1.jpg",
    name: "John Doe",
    age: 32,
    certificates: [
      "Certified Personal Trainer (CPT) - ACE",
      "Sports Nutrition Certification",
      "First Aid & CPR",
    ],
    yearsExperience: 8,
    specialties: ["Strength Training", "Weight Loss", "Functional Fitness"],
    personality:
      "Friendly, patient, and detail-oriented in coaching. Enjoys motivating clients.",
    intro:
      "I specialize in building personalized training programs for both beginners and advanced clients.",
    rating: 4.7,
    feedbacks: [
      {
        user: "Alice",
        comment: "Lost 10kg in 3 months!",
        stars: 5,
        date: "2025-08-10",
      },
      { user: "Mark", comment: "Very patient trainer.", stars: 4, date: "2025-07-22" },
    ],
  },
  {
    id: "102",
    avatar: "/img/team-2.jpg",
    name: "Emily Smith",
    age: 28,
    certificates: ["Certified Yoga Instructor (RYT200)"],
    yearsExperience: 5,
    specialties: ["Yoga", "Pilates", "Meditation"],
    personality: "Calm, supportive, and motivating.",
    intro:
      "Helping people improve flexibility, reduce stress, and gain body awareness.",
    rating: 4.5,
    feedbacks: [
      {
        user: "Sara",
        comment: "Her yoga classes are amazing!",
        stars: 5,
        date: "2025-09-01",
      },
    ],
  },
  {
    id: "103",
    avatar: "/img/team-3.jpg",
    name: "Michael Lee",
    age: 30,
    certificates: ["Certified Boxing Coach", "Strength & Conditioning Specialist"],
    yearsExperience: 7,
    specialties: ["Boxing", "HIIT", "Strength Training"],
    personality: "Energetic and motivating. Pushes clients to break limits.",
    intro:
      "I design programs focusing on boxing technique, stamina, and total body conditioning.",
    rating: 4.6,
    feedbacks: [
      {
        user: "David",
        comment: "Best boxing coach I’ve trained with.",
        stars: 5,
        date: "2025-08-28",
      },
    ],
  },
  {
    id: "104",
    avatar: "/img/team-4.jpg",
    name: "Sophia Brown",
    age: 27,
    certificates: ["Certified Cardio Specialist", "Zumba Instructor"],
    yearsExperience: 6,
    specialties: ["Cardio Fitness", "Dance Workout", "Endurance"],
    personality: "Cheerful, dynamic, and inspiring in every session.",
    intro:
      "I focus on fun, engaging cardio workouts that improve endurance and overall health.",
    rating: 4.8,
    feedbacks: [
      {
        user: "Linda",
        comment: "Sophia’s classes are so much fun!",
        stars: 5,
        date: "2025-09-12",
      },
    ],
  },
];

export default function TrainerDetailPage() {
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { id } = useParams();
  const trainer = trainers.find((t) => t.id === id);

  if (!trainer) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-900 text-lg">
        Trainer not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <TrainerDetail trainer={trainer} />
      </div>
    </div>
  );
}

function TrainerDetail({ trainer }) {
  return (
    <>
      {/* Top Info */}
      <div className="md:flex">
        {/* Left: Avatar */}
        <div className="md:w-1/4 p-6 flex items-center justify-center bg-blue-900">
          <div className="w-44 h-44 rounded-xl overflow-hidden shadow-md border-4 border-white">
            <img
              src={trainer.avatar}
              alt={trainer.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right: Info */}
        <div className="md:w-3/4 p-6">
          <h1 className="text-2xl font-bold text-blue-900">{trainer.name}</h1>
          <p className="text-sm text-gray-600">
            {trainer.age} years old • {trainer.yearsExperience} years experience
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {trainer.specialties.map((s) => (
              <span
                key={s}
                className="text-xs px-2 py-1 rounded-full border border-blue-900 text-blue-900"
              >
                {s}
              </span>
            ))}
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-blue-900">Introduction</h2>
            <p className="mt-2 text-sm text-gray-700">{trainer.intro}</p>
          </section>

          <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-xs font-medium text-blue-900">Personality</h3>
              <p className="mt-2 text-sm text-gray-700">{trainer.personality}</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-xs font-medium text-blue-900">Certificates</h3>
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
                {trainer.certificates.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-sm font-semibold text-blue-900">Experience</h3>
            <p className="mt-2 text-sm text-gray-700">
              {trainer.yearsExperience} years as a trainer — has coached over 500
              clients, including weight loss, muscle gain, and injury recovery plans.
            </p>
          </section>

          <section className="mt-6 flex gap-3">
            <button className="px-4 py-2 rounded-lg border border-blue-900 text-blue-900 font-medium hover:bg-blue-900 hover:text-white transition">
              Send Message
            </button>
            <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition">
              View Availability
            </button>
          </section>

          <section className="mt-6 text-xs text-gray-400">
            <div>Last updated: 20/09/2025</div>
          </section>
        </div>
      </div>

      {/* Rating & Feedback */}
      <div className="p-6 border-t border-gray-100 bg-gray-50">
        <h2 className="text-lg font-bold text-blue-900">Ratings & Feedback</h2>
        <div className="flex items-center mt-2">
          <span className="text-2xl font-bold text-red-600">★</span>
          <span className="ml-1 text-lg font-semibold text-blue-900">
            {trainer.rating}
          </span>
          <span className="ml-2 text-sm text-gray-600">/ 5.0</span>
        </div>

        <div className="mt-4 space-y-4">
          {trainer.feedbacks.map((fb, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-blue-900">{fb.user}</h4>
                <span className="text-xs text-gray-400">{fb.date}</span>
              </div>
              <div className="flex mt-1 text-red-600">
                {Array.from({ length: fb.stars }).map((_, idx) => (
                  <span key={idx}>★</span>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-700">{fb.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
