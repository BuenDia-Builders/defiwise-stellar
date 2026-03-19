import LogrosCard from "./components/logrosCard";
import LogrosTitle from "./components/logrosTitle";
import { BsBookmarkStar, BsCalendarWeek } from "react-icons/bs";
import { logrosData } from "@/data/logrosData";

export default function Airdrop() {
  return (
    <div className="border-[1px] border-lightGrey rounded-2xl mb-10 p-6">
      <LogrosTitle icon={<BsBookmarkStar size={40} fill="darkOrange" />} title="Airdrops adquiridos" />
      <div className="grid grid-cols-3 gap-14 pt-6">
        {logrosData.map((airdrop, index) => (
          <LogrosCard key={index} text={airdrop.text} img={airdrop.img} href={airdrop.href} />
        ))}
        <div className="flex flex-col justify-evenly items-center py-6">
          <BsCalendarWeek size={100} fill="darkOrange" />
          <p className="text-[12px] m-0">¡Asiste a nuestros eventos para ganar más airdrops!</p>
          <button className="border-0 rounded-xl text-white bg-gradient-to-b from-darkOrange to-lightOrange py-[8px] text-semibold px-3 text-btn">
            Próximo evento
          </button>
        </div>
      </div>
    </div>
  );
}
