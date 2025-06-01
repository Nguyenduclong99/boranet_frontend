import authApiRequest from "@/apiRequests/auth";
import { HttpError } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const res = await request.json();
  const force = res.force as boolean | undefined;
  if (force) {
    return Response.json(
      {
        message: "Force logout successful",
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `accessToken=; Path=/; HttpOnly; Max-Age=0`,
        },
      }
    );
  }
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");
  if (!accessToken) {
    return Response.json(
      { message: "Session token not received" },
      {
        status: 401,
      }
    );
  }
  try {
    const result = await authApiRequest.logoutFromNextServerToServer(
      accessToken.value
    );
    return Response.json(result.payload, {
      status: 200,
      headers: {
        "Set-Cookie": `accessToken=; Path=/; HttpOnly; Max-Age=0`,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    } else {
      return Response.json(
        {
          message: "Unknown error",
        },
        {
          status: 500,
        }
      );
    }
  }
}
