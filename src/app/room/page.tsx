"use client";
import { redirect, useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { FaTimesCircle, FaChevronCircleUp } from "react-icons/fa";
import io from "socket.io-client";
import { type } from "os";

let socket: any;

type Player = {
  name: string;
  role: "player" | "adm";
  isCurrentPlayer?: boolean;
  id: string;
};

export default function Room({
  searchParams,
}: {
  searchParams: URLSearchParams & { id: string | undefined };
}) {
  if (!searchParams.id) {
    redirect("/");
  }

  let currentPlayerId = "";
  const [players, setPlayers] = useState<Player[]>([]);
  const router = useRouter();

  const currentPlayer = players.find((player) => player.isCurrentPlayer);
  const socketInitializer = async () => {
    await fetch("/api/socket");
    socket = io();

    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("connected_id", (playerId: string) => {
      currentPlayerId = playerId;
    });

    socket.on("kicked", () => {
      console.log("oh no you got kicked");
      router.push("/");
    });

    socket.on("promoted", () => {
      console.log("you got promoted");
      setPlayers((oldPlayers) => {
        return oldPlayers.map((oldPlayer) => {
          if (oldPlayer.isCurrentPlayer) {
            return { ...oldPlayer, role: "adm" };
          }
          return { ...oldPlayer, role: "player" };
        });
      });
    });

    socket.on("connected_users", (players: Player[]) => {
      if (players === null) return;
      setPlayers(() => {
        return players.map((player) => {
          if (player.id === currentPlayerId) {
            return { ...player, isCurrentPlayer: true };
          }
          return player;
        });
      });
    });
  };
  useEffect(() => {
    socketInitializer();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Write your name to join the room"),
    }),
    onSubmit: ({ name }, { resetForm, setErrors }) => {
      //@ts-ignore
      if (players.find((player) => player.name === name)) {
        return setErrors({ name: "Someone already took this name" });
      }
      setPlayers((oldPlayers) => {
        const admPlayer = players.find((player) => player.role === "adm");
        const thereIsCurrentPlayer = oldPlayers.find(
          (oldPlayer) => oldPlayer.isCurrentPlayer
        );
        if (!thereIsCurrentPlayer) {
          if (!admPlayer) {
            socket.emit("join", {
              name,
              role: "adm",
            });
            return [
              {
                name,
                role: "adm",
                isCurrentPlayer: true,
                id: currentPlayerId,
              },
              ...oldPlayers,
            ];
          }
          socket.emit("join", {
            name,
            role: "player",
            id: currentPlayerId,
          });
          return [
            {
              name,
              role: "player",
              isCurrentPlayer: true,
              id: currentPlayerId,
            },
            ...oldPlayers,
          ];
        }
        return oldPlayers.map((oldPlayer) => {
          if (oldPlayer.isCurrentPlayer) {
            socket.emit("join", {
              name,
              role: oldPlayer.role,
              id: currentPlayerId,
            });
            return { ...oldPlayer, name };
          }
          return oldPlayer;
        });
      });
      resetForm();
    },
  });
  const handleRemovePlayer = (playerId: string) => {
    socket.emit("kick", playerId);
    setPlayers((oldPlayers) => {
      return oldPlayers.filter((oldPlayer) => oldPlayer.id !== playerId);
    });
  };
  const handlePromotePlayer = (playerId: string) => {
    socket.emit("promote", playerId);
    setPlayers((oldPlayers) => {
      return oldPlayers.map((oldPlayer) => {
        if (oldPlayer.id === playerId) {
          return { ...oldPlayer, role: "adm" };
        }
        if (oldPlayer.role === "adm") {
          return { ...oldPlayer, role: "player" };
        }
        return oldPlayer;
      });
    });
  };

  return (
    <div className="flex justify-center items-center w-full h-full bg-gray-50">
      <div className="flex flex-col gap-2 w-96">
        <h1 className="mx-auto text-xl">Room {searchParams.id}</h1>
        <form
          className="flex flex-col gap-2 mb-2 w-full"
          onSubmit={formik.handleSubmit}
        >
          <div className="w-full form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              type="text"
              placeholder="Your Name"
              name="name"
              id="name"
              className={`w-full input input-bordered ${formik.errors.name && formik.touched.name ? "input-error" : ""
                }`}
            />
            {formik.errors.name && formik.touched.name && (
              <label className="label">
                <span className="text-red-600 label-text-alt">
                  {formik.errors.name}
                </span>
              </label>
            )}
          </div>
          <button
            type="submit"
            className={`w-full btn btn-outline btn-primary`}
          >
            Join
          </button>
        </form>
        <div>
          <h2 className="text-lg">Players</h2>
          <ul className="flex overflow-auto flex-col gap-2 p-2 w-full h-40 max-h-40 rounded-md border-2">
            {players.map((player) => {
              return (
                <li
                  key={player.name}
                  className={
                    player.isCurrentPlayer
                      ? "text-primary"
                      : "flex justify-between text-zinc-600"
                  }
                >
                  <span>
                    {player.name} {player.isCurrentPlayer && "(you)"}{" "}
                    {player.role === "adm" && "(adm)"}
                  </span>
                  {currentPlayer?.role === "adm" && !player.isCurrentPlayer && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handlePromotePlayer(player.id);
                        }}
                        className="hover:text-blue-600"
                      >
                        <FaChevronCircleUp />
                      </button>
                      <button
                        onClick={() => {
                          handleRemovePlayer(player.id);
                        }}
                        className="hover:text-red-600"
                      >
                        <FaTimesCircle />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        {currentPlayer?.role === "adm" && (
          <button type="submit" className={`w-full btn btn-primary`}>
            Start
          </button>
        )}
      </div>
    </div>
  );
}
