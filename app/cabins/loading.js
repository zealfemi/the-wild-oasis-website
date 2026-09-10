import Spinner from "../_components/Spinner";

export default function loading() {
  return (
    <div className="grid place-items-center h-full">
      <div>
        <Spinner />
        <p className="text-xl text-primary-200">Loading cabins data...</p>
      </div>
    </div>
  );
}
