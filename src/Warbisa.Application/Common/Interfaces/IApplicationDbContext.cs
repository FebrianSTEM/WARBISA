using Microsoft.EntityFrameworkCore;
using Warbisa.Domain.Entities;

namespace Warbisa.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Warung> Warungs { get; }
    DbSet<Role> Roles { get; }
    DbSet<User> Users { get; }
    DbSet<Menu> Menus { get; }
    DbSet<RoleMenuPermission> RoleMenuPermissions { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<InventoryTransaction> InventoryTransactions { get; }
    DbSet<Transaction> Transactions { get; }
    DbSet<TransactionItem> TransactionItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
