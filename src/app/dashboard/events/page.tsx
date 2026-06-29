"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { eventsData, DeFiEvent, EventStatus } from "@/data/eventsData";
import { BsCalendar3, BsArrowUpRightSquare } from "react-icons/bs";

const TYPE_LABELS: Record<DeFiEvent["type"], string> = {
  webinar: "Webinar",
  workshop: "Workshop",
  ama: "AMA",
  hackathon: "Hackathon",
};

const TYPE_COLORS: Record<DeFiEvent["type"], string> = {
  webinar: "bg-blue-100 text-blue-700",
  workshop: "bg-green-100 text-green-700",
  ama: "bg-purple-100 text-purple-700",
  hackathon: "bg-orange-100 text-orange-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EventCard({ event }: { event: DeFiEvent }) {
  const isPast = event.status === "past";
  return (
    <article
      className={`border border-borderGrey/30 rounded-2xl bg-white overflow-hidden flex flex-col ${isPast ? "opacity-70" : ""}`}
    >
      <div className="relative h-36 bg-lightBeige flex items-center justify-center">
        <Image
          src={event.image}
          alt={event.title}
          width={120}
          height={120}
          className="object-contain"
        />
        {isPast && (
          <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
            Finalizado
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[event.type]}`}
          >
            {TYPE_LABELS[event.type]}
          </span>
        </div>

        <h3 className="font-bold text-darkGreen text-base leading-snug">
          {event.title}
        </h3>

        <p className="text-sm text-darkGrey flex-1">{event.description}</p>

        <div className="flex items-center gap-1.5 text-xs text-darkGrey mt-1">
          <BsCalendar3 size={12} />
          <span>{formatDate(event.date)}</span>
        </div>

        <a
          href={event.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-2 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-colors ${
            isPast
              ? "border border-borderGrey/40 text-darkGrey cursor-default pointer-events-none"
              : "bg-darkOrange text-white hover:bg-darkOrange/90"
          }`}
          aria-disabled={isPast}
        >
          {isPast ? "Evento pasado" : "Registrarme"}
          {!isPast && <BsArrowUpRightSquare size={14} />}
        </a>
      </div>
    </article>
  );
}

export default function EventsPage() {
  const [filter, setFilter] = useState<EventStatus>("upcoming");

  const filtered = eventsData.filter((e) => e.status === filter);

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-darkOrange mb-1">Eventos</h2>
      <p className="text-sm text-darkGrey mb-6">
        Webinars, workshops y actividades de la comunidad DeFiWise.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["upcoming", "past"] as EventStatus[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filter === tab
                ? "bg-darkOrange text-white border-darkOrange"
                : "bg-white text-darkGrey border-borderGrey/40 hover:border-darkOrange"
            }`}
          >
            {tab === "upcoming" ? "Próximos" : "Pasados"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-darkGrey text-sm">No hay eventos en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
