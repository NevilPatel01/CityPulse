-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "current_location" VARCHAR(100),
    "hometown" VARCHAR(100),
    "phone" VARCHAR(20),
    "is_google_user" BOOLEAN NOT NULL DEFAULT false,
    "google_id" VARCHAR(100),
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "account_status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "public"."users"("google_id");
