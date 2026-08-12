using Microsoft.EntityFrameworkCore;
using Warbisa.Application.Common.Interfaces;
using Warbisa.Domain.Entities;

namespace Warbisa.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService? _currentUserService;
    public Guid? CurrentWarungId => _currentUserService?.WarungId;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService? currentUserService = null)
        : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<Warung> Warungs => Set<Warung>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Menu> Menus => Set<Menu>();
    public DbSet<RoleMenuPermission> RoleMenuPermissions => Set<RoleMenuPermission>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TransactionItem> TransactionItems => Set<TransactionItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Table Mapping & Configurations

        modelBuilder.Entity<Warung>(b =>
        {
            b.ToTable("warungs");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(100).IsRequired();
            b.Property(x => x.Address).HasColumnType("text");
            b.Property(x => x.Phone).HasMaxLength(20);
            b.Property(x => x.LogoUrl).HasColumnType("text");
        });

        modelBuilder.Entity<Role>(b =>
        {
            b.ToTable("roles");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(50).IsRequired();
            b.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<User>(b =>
        {
            b.ToTable("users");
            b.HasKey(x => x.Id);
            b.Property(x => x.Username).HasMaxLength(50).IsRequired();
            b.HasIndex(x => x.Username).IsUnique();
            b.Property(x => x.Email).HasMaxLength(100).IsRequired();
            b.HasIndex(x => x.Email).IsUnique();
            b.Property(x => x.FullName).HasMaxLength(100).IsRequired();

            b.HasOne(x => x.Warung)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.WarungId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Global Query Filter for Warung Multi-tenancy
            b.HasQueryFilter(x => CurrentWarungId == null || x.WarungId == CurrentWarungId);
        });

        modelBuilder.Entity<Menu>(b =>
        {
            b.ToTable("menus");
            b.HasKey(x => x.Id);
            b.Property(x => x.Title).HasMaxLength(100).IsRequired();
            b.Property(x => x.Route).HasMaxLength(100).IsRequired();
            b.Property(x => x.Icon).HasMaxLength(50);

            b.HasOne(x => x.Parent)
                .WithMany(x => x.SubMenus)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RoleMenuPermission>(b =>
        {
            b.ToTable("role_menu_permissions");
            b.HasKey(x => new { x.RoleId, x.MenuId });

            b.HasOne(x => x.Role)
                .WithMany(x => x.RoleMenuPermissions)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Menu)
                .WithMany(x => x.RoleMenuPermissions)
                .HasForeignKey(x => x.MenuId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Category>(b =>
        {
            b.ToTable("categories");
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).HasMaxLength(100).IsRequired();

            b.HasIndex(x => new { x.WarungId, x.Name }).IsUnique();

            b.HasOne(x => x.Warung)
                .WithMany(x => x.Categories)
                .HasForeignKey(x => x.WarungId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasQueryFilter(x => CurrentWarungId == null || x.WarungId == CurrentWarungId);
        });

        modelBuilder.Entity<Product>(b =>
        {
            b.ToTable("products");
            b.HasKey(x => x.Id);
            b.Property(x => x.Sku).HasMaxLength(100).IsRequired();
            b.Property(x => x.Barcode).HasMaxLength(100);
            b.Property(x => x.Name).HasMaxLength(150).IsRequired();
            b.Property(x => x.Unit).HasMaxLength(20).HasDefaultValue("Pcs");
            b.Property(x => x.CostPrice).HasPrecision(15, 2);
            b.Property(x => x.SellingPrice).HasPrecision(15, 2);

            b.HasIndex(x => new { x.WarungId, x.Sku }).IsUnique();
            b.HasIndex(x => x.Barcode);

            b.HasOne(x => x.Warung)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.WarungId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Category)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasQueryFilter(x => CurrentWarungId == null || x.WarungId == CurrentWarungId);
        });

        modelBuilder.Entity<InventoryTransaction>(b =>
        {
            b.ToTable("inventory_transactions");
            b.HasKey(x => x.Id);
            b.Property(x => x.Type).HasMaxLength(20).IsRequired();

            b.HasOne(x => x.Warung)
                .WithMany(x => x.InventoryTransactions)
                .HasForeignKey(x => x.WarungId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.Product)
                .WithMany(x => x.InventoryTransactions)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasQueryFilter(x => CurrentWarungId == null || x.WarungId == CurrentWarungId);
        });

        modelBuilder.Entity<Transaction>(b =>
        {
            b.ToTable("transactions");
            b.HasKey(x => x.Id);
            b.Property(x => x.InvoiceNo).HasMaxLength(50).IsRequired();
            b.HasIndex(x => x.InvoiceNo).IsUnique();
            b.Property(x => x.CustomerName).HasMaxLength(100).HasDefaultValue("Pelanggan Umum");
            b.Property(x => x.PaymentMethod).HasMaxLength(20).IsRequired();
            b.Property(x => x.PaymentStatus).HasMaxLength(20).HasDefaultValue("Pending");
            b.Property(x => x.TotalAmount).HasPrecision(15, 2);
            b.Property(x => x.PaidAmount).HasPrecision(15, 2);
            b.Property(x => x.ChangeAmount).HasPrecision(15, 2);

            b.HasOne(x => x.Warung)
                .WithMany(x => x.Transactions)
                .HasForeignKey(x => x.WarungId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasQueryFilter(x => CurrentWarungId == null || x.WarungId == CurrentWarungId);
        });

        modelBuilder.Entity<TransactionItem>(b =>
        {
            b.ToTable("transaction_items");
            b.HasKey(x => x.Id);
            b.Property(x => x.CostPriceAtSale).HasPrecision(15, 2);
            b.Property(x => x.SellingPriceAtSale).HasPrecision(15, 2);
            b.Property(x => x.Subtotal).HasPrecision(15, 2);

            b.HasOne(x => x.Transaction)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.TransactionId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            b.HasOne(x => x.Product)
                .WithMany(x => x.TransactionItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
        });

        // Seed Data
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Owner", Description = "Pemilik Warung (Akses Penuh)" },
            new Role { Id = 2, Name = "Staff", Description = "Staf Kasir & Stok Warung" }
        );

        modelBuilder.Entity<Menu>().HasData(
            new Menu { Id = 1, Title = "Dashboard", Route = "/dashboard", Icon = "LayoutDashboard", OrderNo = 1 },
            new Menu { Id = 2, Title = "POS Checkout", Route = "/pos", Icon = "ShoppingCart", OrderNo = 2 },
            new Menu { Id = 3, Title = "Inventory Stock", Route = "/inventory", Icon = "Package", OrderNo = 3 },
            new Menu { Id = 4, Title = "Reports & Analytics", Route = "/reports", Icon = "TrendingUp", OrderNo = 4 },
            new Menu { Id = 5, Title = "Staff Management", Route = "/staff", Icon = "Users", OrderNo = 5 }
        );

        modelBuilder.Entity<RoleMenuPermission>().HasData(
            // Owner permissions (Full Access)
            new RoleMenuPermission { RoleId = 1, MenuId = 1, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = true },
            new RoleMenuPermission { RoleId = 1, MenuId = 2, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = true },
            new RoleMenuPermission { RoleId = 1, MenuId = 3, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = true },
            new RoleMenuPermission { RoleId = 1, MenuId = 4, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = true },
            new RoleMenuPermission { RoleId = 1, MenuId = 5, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = true },

            // Staff permissions (POS & Inventory)
            new RoleMenuPermission { RoleId = 2, MenuId = 2, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = false },
            new RoleMenuPermission { RoleId = 2, MenuId = 3, CanRead = true, CanCreate = true, CanUpdate = true, CanDelete = false }
        );
    }
}
