ALTER TABLE "RsvpResponse" DROP CONSTRAINT "RsvpResponse_companions_check";
ALTER TABLE "RsvpResponse" ADD CONSTRAINT "RsvpResponse_companions_check"
  CHECK ("companions" BETWEEN 0 AND 10 AND ("attending" OR "companions" = 0));
