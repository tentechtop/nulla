using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class BrandAssetRenderer
{
    private const float ModuleRatio = 0.215f;
    private const float GapRatio = 0.075f;
    private static readonly int[][] ModulePlacements = new int[][]
    {
        new int[] {0, 0},
        new int[] {2, 0},
        new int[] {1, 1},
        new int[] {0, 2},
        new int[] {2, 2}
    };

    public static void SaveIcon(string targetPath)
    {
        using (Bitmap bitmap = CreateCanvas(1024, 1024, Color.Transparent))
        using (Graphics graphics = Graphics.FromImage(bitmap))
        {
            ConfigureGraphics(graphics);
            DrawAppIcon(graphics, 512f, 512f, 1024f);
            bitmap.Save(targetPath, ImageFormat.Png);
        }
    }

    public static void SaveSplashLogo(string targetPath)
    {
        using (Bitmap bitmap = CreateCanvas(720, 720, Color.Transparent))
        using (Graphics graphics = Graphics.FromImage(bitmap))
        using (SolidBrush blackBrush = new SolidBrush(Color.FromArgb(5, 5, 5)))
        {
            ConfigureGraphics(graphics);
            DrawGlyph(graphics, CenteredBounds(360f, 360f, 430f), blackBrush);
            bitmap.Save(targetPath, ImageFormat.Png);
        }
    }

    public static void SaveSplash(string targetPath)
    {
        using (Bitmap bitmap = CreateCanvas(1242, 2688, Color.White))
        using (Graphics graphics = Graphics.FromImage(bitmap))
        using (SolidBrush blackBrush = new SolidBrush(Color.FromArgb(5, 5, 5)))
        {
            ConfigureGraphics(graphics);
            DrawGlyph(graphics, CenteredBounds(621f, 1344f, 330f), blackBrush);
            bitmap.Save(targetPath, ImageFormat.Png);
        }
    }

    private static Bitmap CreateCanvas(int width, int height, Color backgroundColor)
    {
        Bitmap bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (Graphics graphics = Graphics.FromImage(bitmap))
        {
            graphics.Clear(backgroundColor);
        }
        return bitmap;
    }

    private static void ConfigureGraphics(Graphics graphics)
    {
        graphics.SmoothingMode = SmoothingMode.AntiAlias;
        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
        graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
    }

    private static RectangleF CenteredBounds(float centerX, float centerY, float size)
    {
        return new RectangleF(centerX - (size / 2f), centerY - (size / 2f), size, size);
    }

    private static void DrawAppIcon(Graphics graphics, float centerX, float centerY, float canvasSize)
    {
        float panelSize = canvasSize * 0.742f;
        RectangleF panelBounds = CenteredBounds(centerX, centerY, panelSize);
        using (GraphicsPath panelPath = RoundedRectangle(panelBounds, panelSize * 0.188f))
        using (SolidBrush panelBrush = new SolidBrush(Color.FromArgb(2, 3, 4)))
        using (SolidBrush logoBrush = new SolidBrush(Color.White))
        {
            graphics.FillPath(panelBrush, panelPath);
            DrawGlyph(graphics, panelBounds, logoBrush);
        }
    }

    private static void DrawGlyph(Graphics graphics, RectangleF bounds, Brush moduleBrush)
    {
        float moduleSize = bounds.Width * ModuleRatio;
        float moduleGap = bounds.Width * GapRatio;
        float contentSize = (moduleSize * 3f) + (moduleGap * 2f);
        float offsetX = bounds.X + ((bounds.Width - contentSize) / 2f);
        float offsetY = bounds.Y + ((bounds.Height - contentSize) / 2f);

        foreach (int[] placement in ModulePlacements)
        {
            float left = offsetX + (placement[0] * (moduleSize + moduleGap));
            float top = offsetY + (placement[1] * (moduleSize + moduleGap));
            graphics.FillRectangle(moduleBrush, left, top, moduleSize, moduleSize);
        }
    }

    private static GraphicsPath RoundedRectangle(RectangleF bounds, float radius)
    {
        float safeRadius = Math.Min(radius, Math.Min(bounds.Width, bounds.Height) / 2f);
        float diameter = safeRadius * 2f;
        GraphicsPath path = new GraphicsPath();
        path.AddArc(bounds.X, bounds.Y, diameter, diameter, 180f, 90f);
        path.AddArc(bounds.Right - diameter, bounds.Y, diameter, diameter, 270f, 90f);
        path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0f, 90f);
        path.AddArc(bounds.X, bounds.Bottom - diameter, diameter, diameter, 90f, 90f);
        path.CloseFigure();
        return path;
    }
}