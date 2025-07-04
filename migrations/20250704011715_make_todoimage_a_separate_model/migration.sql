-- CreateTable
CREATE TABLE "TodoImage" (
    "id" TEXT NOT NULL,
    "image_id" TEXT,
    "image_filesize" INTEGER,
    "image_width" INTEGER,
    "image_height" INTEGER,
    "image_extension" TEXT,
    "imagePath" TEXT NOT NULL DEFAULT '',
    "altText" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,

    CONSTRAINT "TodoImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Todo_todoImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Todo_todoImages_AB_unique" ON "_Todo_todoImages"("A", "B");

-- CreateIndex
CREATE INDEX "_Todo_todoImages_B_index" ON "_Todo_todoImages"("B");

-- AddForeignKey
ALTER TABLE "_Todo_todoImages" ADD CONSTRAINT "_Todo_todoImages_A_fkey" FOREIGN KEY ("A") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Todo_todoImages" ADD CONSTRAINT "_Todo_todoImages_B_fkey" FOREIGN KEY ("B") REFERENCES "TodoImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
