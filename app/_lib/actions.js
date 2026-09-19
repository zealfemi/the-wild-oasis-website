"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import { auth, signIn, signOut } from "./auth";
import { getBookings } from "./data-service";
import { supabase } from "./supabase";

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const nationalID = formData.get("nationalID");
  const [nationality, flag] = formData.get("nationality").split("%");

  const flagShortcode = Array.from(flag)
    .map((char) => {
      const codePoint = char.codePointAt(0);
      if (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) {
        return String.fromCodePoint(codePoint - 0x1f1e6 + 65);
      }
      return char;
    })
    .join("")
    .toLocaleLowerCase();

  const countryFlag = `https://flagcdn.com/${flagShortcode}.svg`;

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Enter valid national ID");

  const updatedData = { nationalID, nationality, countryFlag };

  const { error } = await supabase
    .from("guests")
    .update(updatedData)
    .eq("id", session.user.guestId);

  if (error) throw new Error("Guest could not be updated");

  revalidatePath("/account/profile");
}

export async function updateReservations(formData) {
  const session = await auth();
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  const reservationId = Number(formData.get("reservationId"));

  if (!guestBookingsIds.includes(reservationId))
    throw new Error("You are not allowed to edit this reservation");

  const updatedData = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };

  const { error } = await supabase
    .from("bookings")
    .update(updatedData)
    .eq("id", reservationId);

  if (error) throw new Error("Booking could not be updated");

  revalidatePath(`/account/reservations/edit/${reservationId}`);
  revalidatePath("/account/reservations");

  redirect("/account/reservations", RedirectType.replace);
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: 0,
    totalPrice: bookingData.cabinPrice,
    hasBreakfast: false,
    isPaid: false,
    status: "unconfirmed",
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert([newBooking])
    // So that the newly created object gets returned!
    .select()
    .single();

  if (error) throw new Error("Booking could not be created");

  revalidatePath(`/cabins/${bookingData.cabinId}`);

  redirect("/cabins/thank-you", RedirectType.replace);
}

export async function deleteBooking(bookingId) {
  // await new Promise((res) => setTimeout(res, 2000));

  const session = await auth();
  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to delete this booking");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error("Booking could not be deleted");

  revalidatePath("/account/reservations");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
