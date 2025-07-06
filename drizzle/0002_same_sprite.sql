ALTER TABLE "inbox_data" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "inbox_data" ADD CONSTRAINT "inbox_data_id_unique" UNIQUE("id");