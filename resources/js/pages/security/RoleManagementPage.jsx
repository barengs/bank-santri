import React, { useState, useEffect } from 'react';
import { 
    useGetRolesQuery, 
    useGetMenusQuery, 
    useSyncRoleMenusMutation,
    useSyncRolePermissionsMutation,
    useGetPermissionsQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDestroyRoleMutation
} from '../../store/securityApi';
import { toast } from 'react-toastify';
import { 
    Shield, 
    Save, 
    Plus, 
    Edit2,
    Trash2, 
    ChevronDown, 
    ChevronRight,
    Lock,
    LayoutDashboard,
    BookOpen,
    CreditCard,
    PlusCircle,
    Users,
    ArrowUpCircle,
    Send,
    History,
    Package,
    Receipt,
    ShieldCheck,
    PieChart,
    Settings,
    ArrowRightLeft,
    DollarSign,
    Store,
    Folder,
    FileText
} from 'lucide-react';
import Modal from '../../components/Modal';

const RoleManagementPage = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [checkedMenus, setCheckedMenus] = useState([]);
    const [checkedPermissions, setCheckedPermissions] = useState([]);
    
    // Modal state for Edit / Add Role
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleFormData, setRoleFormData] = useState({ name: '', slug: '', description: '' });
    const [editingRole, setEditingRole] = useState(null);
    const [modalCheckedMenus, setModalCheckedMenus] = useState([]);
    const [modalCheckedPermissions, setModalCheckedPermissions] = useState([]);

    // Expand state for submenus
    const [expandedMenus, setExpandedMenus] = useState({});

    const { data: rolesRes, isLoading: rolesLoading } = useGetRolesQuery();
    const { data: menusRes, isLoading: menusLoading } = useGetMenusQuery();
    const { data: permissionsRes, isLoading: permissionsLoading } = useGetPermissionsQuery();
    
    const [syncMenus, { isLoading: isSyncing }] = useSyncRoleMenusMutation();
    const [syncPermissions, { isLoading: isSyncingPermissions }] = useSyncRolePermissionsMutation();
    const [createRole] = useCreateRoleMutation();
    const [updateRole] = useUpdateRoleMutation();
    const [destroyRole] = useDestroyRoleMutation();

    const roles = rolesRes?.data || [];
    const menus = menusRes?.data || [];
    const permissions = permissionsRes?.data || [];

    // Helper to generate consistent menu slug
    const getMenuSlug = (menu) => {
        if (!menu) return '';
        if (menu.slug) return menu.slug;
        return (menu.name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    };

    // Initialize selected role
    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0]);
        }
    }, [roles]);

    // Update checked items when selected role changes
    useEffect(() => {
        if (selectedRole) {
            const menuIds = selectedRole.menus?.map(m => m.id) || [];
            setCheckedMenus(menuIds);
            const permIds = selectedRole.permissions?.map(p => p.id) || [];
            const permNames = selectedRole.permissions?.map(p => p.name) || [];
            
            // If admin role has empty permissions (e.g. fresh DB before seeder), fallback to checking all permissions
            if (selectedRole.name === 'admin' && permIds.length === 0 && permissions.length > 0) {
                setCheckedPermissions(permissions.map(p => p.id));
            } else {
                setCheckedPermissions(Array.from(new Set([...permIds, ...permNames])));
            }
        }
    }, [selectedRole, permissions]);

    // Auto expand all parent menus initially
    useEffect(() => {
        if (menus.length > 0) {
            const initialExpanded = {};
            menus.forEach(m => {
                if (m.children && m.children.length > 0) {
                    initialExpanded[m.id] = true;
                }
            });
            setExpandedMenus(initialExpanded);
        }
    }, [menus]);

    const toggleExpand = (menuId) => {
        setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
    };

    // Helper: Render Lucide icon matching database icon name
    const renderMenuIcon = (iconName, isParent = false) => {
        const iconProps = { size: 15, className: isParent ? "text-slate-700" : "text-slate-500" };
        switch (iconName) {
            case 'LayoutDashboard': return <LayoutDashboard {...iconProps} />;
            case 'BookOpen': return <BookOpen {...iconProps} />;
            case 'CreditCard': return <CreditCard {...iconProps} />;
            case 'PlusCircle': return <PlusCircle {...iconProps} />;
            case 'Users': return <Users {...iconProps} />;
            case 'ArrowUpCircle': return <ArrowUpCircle {...iconProps} />;
            case 'Send': return <Send {...iconProps} />;
            case 'History': return <History {...iconProps} />;
            case 'Package': return <Package {...iconProps} />;
            case 'Receipt': return <Receipt {...iconProps} />;
            case 'ShieldCheck': return <ShieldCheck {...iconProps} />;
            case 'PieChart': return <PieChart {...iconProps} />;
            case 'Settings': return <Settings {...iconProps} />;
            case 'ArrowRightLeft': return <ArrowRightLeft {...iconProps} />;
            case 'DollarSign': return <DollarSign {...iconProps} />;
            case 'Store': return <Store {...iconProps} />;
            case 'Lock': return <Lock {...iconProps} />;
            default: return isParent ? <Folder {...iconProps} className="text-amber-500" /> : <FileText {...iconProps} />;
        }
    };

    // Permission check helper (matches by permission ID or permission name)
    const isPermCheckedIn = (menuSlug, action, permList) => {
        const slug = `${menuSlug}.${action}`;
        const perm = permissions.find(p => p.name === slug);
        if (perm && permList.includes(perm.id)) return true;
        return permList.includes(slug);
    };

    // Permission toggle helper (supports both ID and name fallback)
    const togglePermIn = (menuSlug, action, permList, setPermList) => {
        const slug = `${menuSlug}.${action}`;
        const perm = permissions.find(p => p.name === slug);
        const identifier = perm ? perm.id : slug;
        
        setPermList(prev => {
            const isChecked = (perm && prev.includes(perm.id)) || prev.includes(slug);
            if (isChecked) {
                return prev.filter(p => p !== (perm ? perm.id : null) && p !== slug);
            } else {
                return [...prev, identifier];
            }
        });
    };

    // Toggle menu visibility (VIEW)
    const toggleMenuIn = (menuId, children = [], menuList, setMenuList) => {
        setMenuList(prev => {
            const isChecked = prev.includes(menuId);
            if (isChecked) {
                const childIds = children?.map(c => c.id) || [];
                return prev.filter(id => id !== menuId && !childIds.includes(id));
            } else {
                const childIds = children?.map(c => c.id) || [];
                return Array.from(new Set([...prev, menuId, ...childIds]));
            }
        });
    };

    // Toggle all actions in a single menu row
    const toggleRowAll = (menu, menuList, setMenuList, permList, setPermList) => {
        const menuSlug = getMenuSlug(menu);
        const actions = ['view', 'create', 'update', 'delete', 'print', 'approve'];
        const isMenuChecked = menuList.includes(menu.id);
        const allPermsChecked = actions.every(a => isPermCheckedIn(menuSlug, a, permList));
        const allChecked = isMenuChecked && allPermsChecked;

        if (allChecked) {
            // Uncheck menu and all its perms
            const childIds = menu.children?.map(c => c.id) || [];
            setMenuList(prev => prev.filter(id => id !== menu.id && !childIds.includes(id)));
            
            setPermList(prev => {
                const toRemove = new Set();
                actions.forEach(a => {
                    const slug = `${menuSlug}.${a}`;
                    const perm = permissions.find(p => p.name === slug);
                    toRemove.add(slug);
                    if (perm) toRemove.add(perm.id);
                });
                return prev.filter(p => !toRemove.has(p));
            });
        } else {
            // Check menu and all its perms
            const childIds = menu.children?.map(c => c.id) || [];
            setMenuList(prev => Array.from(new Set([...prev, menu.id, ...childIds])));
            
            setPermList(prev => {
                const toAdd = [];
                actions.forEach(a => {
                    const slug = `${menuSlug}.${a}`;
                    const perm = permissions.find(p => p.name === slug);
                    if (perm) toAdd.push(perm.id);
                    toAdd.push(slug);
                });
                return Array.from(new Set([...prev, ...toAdd]));
            });
        }
    };

    // Toggle entire column across all menus
    const toggleColumnAll = (action, permList, setPermList) => {
        const allSlugs = [];
        menus.filter(m => !m.is_divider).forEach(m => {
            allSlugs.push(getMenuSlug(m));
            if (m.children) {
                m.children.forEach(c => allSlugs.push(getMenuSlug(c)));
            }
        });

        const allChecked = allSlugs.every(slug => isPermCheckedIn(slug, action, permList));
        
        setPermList(prev => {
            const toRemove = new Set();
            const toAdd = [];

            allSlugs.forEach(slug => {
                const permName = `${slug}.${action}`;
                const perm = permissions.find(p => p.name === permName);
                if (allChecked) {
                    toRemove.add(permName);
                    if (perm) toRemove.add(perm.id);
                } else {
                    if (perm) toAdd.push(perm.id);
                    toAdd.push(permName);
                }
            });

            if (allChecked) {
                return prev.filter(p => !toRemove.has(p));
            } else {
                return Array.from(new Set([...prev, ...toAdd]));
            }
        });
    };

    // Toggle VIEW column for all menus
    const toggleAllViewMenus = (menuList, setMenuList) => {
        const allMenuIds = [];
        menus.filter(m => !m.is_divider).forEach(m => {
            allMenuIds.push(m.id);
            if (m.children) {
                m.children.forEach(c => allMenuIds.push(c.id));
            }
        });

        const allChecked = allMenuIds.length > 0 && allMenuIds.every(id => menuList.includes(id));
        if (allChecked) {
            setMenuList([]);
        } else {
            setMenuList(allMenuIds);
        }
    };

    // Save handler for inline right panel
    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            await syncMenus({ id: selectedRole.id, menu_ids: checkedMenus }).unwrap();
            await syncPermissions({ id: selectedRole.id, permission_ids: checkedPermissions }).unwrap();
            toast.success(`Matriks hak akses dan menu role ${selectedRole.name} berhasil disimpan!`);
        } catch (err) {
            toast.error(err.data?.message || 'Gagal menyimpan hak akses');
        }
    };

    // Open modal for Add or Edit
    const handleOpenRoleModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setRoleFormData({ name: role.name, slug: role.slug, description: role.description || '' });
            setModalCheckedMenus(role.menus?.map(m => m.id) || []);
            const permIds = role.permissions?.map(p => p.id) || [];
            const permNames = role.permissions?.map(p => p.name) || [];
            if (role.name === 'admin' && permIds.length === 0 && permissions.length > 0) {
                setModalCheckedPermissions(permissions.map(p => p.id));
            } else {
                setModalCheckedPermissions(Array.from(new Set([...permIds, ...permNames])));
            }
        } else {
            setEditingRole(null);
            setRoleFormData({ name: '', slug: '', description: '' });
            setModalCheckedMenus([]);
            setModalCheckedPermissions([]);
        }
        setIsRoleModalOpen(true);
    };

    // Submit handler inside modal
    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            let roleId;
            if (editingRole) {
                await updateRole({ id: editingRole.id, ...roleFormData }).unwrap();
                roleId = editingRole.id;
            } else {
                const res = await createRole(roleFormData).unwrap();
                roleId = res.data?.id;
            }

            if (roleId) {
                await syncMenus({ id: roleId, menu_ids: modalCheckedMenus }).unwrap();
                await syncPermissions({ id: roleId, permission_ids: modalCheckedPermissions }).unwrap();
            }

            toast.success(editingRole ? 'Peran dan matriks hak akses berhasil diperbarui' : 'Peran baru berhasil ditambahkan');
            setIsRoleModalOpen(false);
        } catch (err) {
            toast.error(err.data?.message || 'Terjadi kesalahan saat menyimpan peran');
        }
    };

    // Delete role handler
    const handleDeleteRole = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Yakin ingin menghapus role ini? Semua user dengan role ini akan kehilangan akses.')) {
            try {
                await destroyRole(id).unwrap();
                toast.success('Role berhasil dihapus');
                if (selectedRole?.id === id) setSelectedRole(roles[0] || null);
            } catch (err) {
                toast.error(err.data?.message || 'Gagal menghapus role');
            }
        }
    };

    // Reusable Matrix Table Component
    const renderMatrixTable = (menuList, setMenuList, permList, setPermList) => {
        const actionColumns = ['create', 'update', 'delete', 'print', 'approve'];

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-gray-600">
                            <th className="text-left px-3.5 py-2.5 font-semibold tracking-wider text-[11px] uppercase w-56 sm:w-72">
                                Modul / Menu
                            </th>
                            <th className="text-center px-2 py-2.5 font-semibold tracking-wider text-[11px] uppercase cursor-pointer hover:bg-slate-100"
                                onClick={() => toggleAllViewMenus(menuList, setMenuList)}
                                title="Klik untuk pilih / lepas semua View"
                            >
                                View
                            </th>
                            {actionColumns.map(act => (
                                <th 
                                    key={act} 
                                    className="text-center px-2 py-2.5 font-semibold tracking-wider text-[11px] uppercase cursor-pointer hover:bg-slate-100"
                                    onClick={() => toggleColumnAll(act, permList, setPermList)}
                                    title={`Klik untuk pilih / lepas semua ${act.toUpperCase()}`}
                                >
                                    {act}
                                </th>
                            ))}
                            <th className="text-center px-2 py-2.5 font-semibold tracking-wider text-[11px] uppercase">
                                Semua
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {menus.filter(m => !m.is_divider).map((menu) => {
                            const menuSlug = getMenuSlug(menu);
                            const hasChildren = menu.children && menu.children.length > 0;
                            const isExpanded = expandedMenus[menu.id] ?? true;
                            const isMenuChecked = menuList.includes(menu.id);

                            const allActions = ['view', 'create', 'update', 'delete', 'print', 'approve'];
                            const isRowAllChecked = isMenuChecked && allActions.every(a => isPermCheckedIn(menuSlug, a, permList));

                            return (
                                <React.Fragment key={menu.id}>
                                    {/* Parent / Standalone Menu Row */}
                                    <tr className={`transition-colors ${hasChildren ? 'bg-slate-50/70 hover:bg-slate-100/70 font-semibold' : 'hover:bg-slate-50'}`}>
                                        <td className="px-3.5 py-2.5">
                                            <div className="flex items-center gap-2">
                                                {hasChildren ? (
                                                    <button 
                                                        type="button"
                                                        onClick={() => toggleExpand(menu.id)}
                                                        className="text-gray-400 hover:text-gray-700 transition-colors p-0.5"
                                                    >
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                ) : (
                                                    <div className="w-4" />
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {renderMenuIcon(menu.icon, hasChildren)}
                                                    <span className={`text-xs ${hasChildren ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>
                                                        {menu.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* VIEW Checkbox */}
                                        <td className="text-center px-2 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isMenuChecked}
                                                onChange={() => toggleMenuIn(menu.id, menu.children, menuList, setMenuList)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>

                                        {/* Actions Checkboxes */}
                                        {actionColumns.map(action => {
                                            const isChecked = isPermCheckedIn(menuSlug, action, permList);
                                            return (
                                                <td key={action} className="text-center px-2 py-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => togglePermIn(menuSlug, action, permList, setPermList)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                            );
                                        })}

                                        {/* Toggle Row All */}
                                        <td className="text-center px-2 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={isRowAllChecked}
                                                onChange={() => toggleRowAll(menu, menuList, setMenuList, permList, setPermList)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                    </tr>

                                    {/* Child Submenu Rows */}
                                    {hasChildren && isExpanded && menu.children.map(child => {
                                        const childSlug = getMenuSlug(child);
                                        const isChildChecked = menuList.includes(child.id);
                                        const isChildRowAllChecked = isChildChecked && allActions.every(a => isPermCheckedIn(childSlug, a, permList));

                                        return (
                                            <tr key={child.id} className="hover:bg-blue-50/40 transition-colors bg-white">
                                                <td className="px-3.5 py-2 pl-9 sm:pl-11">
                                                    <div className="flex items-center gap-2">
                                                        {renderMenuIcon(child.icon, false)}
                                                        <span className="text-xs text-gray-700">{child.name}</span>
                                                    </div>
                                                </td>

                                                {/* Child VIEW Checkbox */}
                                                <td className="text-center px-2 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChildChecked}
                                                        onChange={() => toggleMenuIn(child.id, [], menuList, setMenuList)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Child Actions Checkboxes */}
                                                {actionColumns.map(action => {
                                                    const isChecked = isPermCheckedIn(childSlug, action, permList);
                                                    return (
                                                        <td key={action} className="text-center px-2 py-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => togglePermIn(childSlug, action, permList, setPermList)}
                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                    );
                                                })}

                                                {/* Child Toggle Row All */}
                                                <td className="text-center px-2 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChildRowAllChecked}
                                                        onChange={() => toggleRowAll(child, menuList, setMenuList, permList, setPermList)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    if (rolesLoading || menusLoading || permissionsLoading) {
        return <div className="p-8 text-center text-xs text-gray-500">Memuat data peran dan matriks hak akses...</div>;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Role & Hak Akses</h2>
                    <p className="text-xs text-gray-500">Atur pemetaan akses menu dan matriks izin aksi granular untuk setiap peran pengguna</p>
                </div>
                <button 
                    onClick={() => handleOpenRoleModal()}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    <span>Tambah Role</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Role List */}
                <div className="lg:col-span-3 space-y-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Daftar Role</span>
                    <div className="border border-gray-200 rounded-md overflow-hidden divide-y divide-gray-100">
                        {roles.map((role) => (
                            <div 
                                key={role.id}
                                onClick={() => setSelectedRole(role)}
                                className={`group flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                                    selectedRole?.id === role.id 
                                        ? 'bg-blue-50 border-l-4 border-l-blue-600 font-semibold' 
                                        : 'hover:bg-gray-50 border-l-4 border-l-transparent text-gray-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded ${selectedRole?.id === role.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <Shield size={14} />
                                    </div>
                                    <div>
                                        <div className="font-semibold capitalize text-gray-800">{role.name}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{role.slug}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleOpenRoleModal(role); }}
                                        className="border border-blue-200 text-blue-600 hover:bg-blue-50 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDeleteRole(role.id, e)}
                                        className="border border-rose-200 text-rose-600 hover:bg-rose-50 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Inline Role Matrix Management */}
                <div className="lg:col-span-9 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-md">
                        <div>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
                                Matriks Hak Akses: <span className="text-blue-700 font-bold uppercase">{selectedRole?.name || '-'}</span>
                            </span>
                            <span className="text-[11px] text-gray-500">
                                Klik kotak pada setiap kolom untuk menentukan izin aksi, atau klik header kolom untuk pilih semua.
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedRole && (
                                <button
                                    type="button"
                                    onClick={() => handleOpenRoleModal(selectedRole)}
                                    className="flex items-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                >
                                    <Edit2 size={13} />
                                    <span>Edit Peran</span>
                                </button>
                            )}
                            <button 
                                onClick={handleSavePermissions}
                                disabled={isSyncing || isSyncingPermissions || !selectedRole}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-sm"
                            >
                                <Save size={14} />
                                <span>{isSyncing || isSyncingPermissions ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                        {!selectedRole ? (
                            <div className="flex flex-col items-center justify-center h-56 text-gray-400 space-y-1">
                                <Shield size={36} className="opacity-20 mb-2" />
                                <p className="text-xs">Pilih salah satu role di sebelah kiri untuk melihat matriks hak akses.</p>
                            </div>
                        ) : (
                            renderMatrixTable(checkedMenus, setCheckedMenus, checkedPermissions, setCheckedPermissions)
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Edit / Tambah Role (Matches exact screenshot layout) */}
            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={editingRole ? `Edit Role: ${editingRole.name}` : 'Tambah Role Baru'}
                size="xl"
            >
                <form onSubmit={handleRoleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 block">
                            Nama Peran <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Contoh: Developer"
                            value={roleFormData.name}
                            onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                                Matriks Hak Akses
                            </h4>
                            <span className="text-[11px] text-gray-400">
                                Berikan tanda centang pada aksi yang diizinkan untuk peran ini
                            </span>
                        </div>
                        <div className="border border-gray-200 rounded overflow-hidden max-h-[400px] overflow-y-auto">
                            {renderMatrixTable(modalCheckedMenus, setModalCheckedMenus, modalCheckedPermissions, setModalCheckedPermissions)}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRoleModalOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-300 text-xs font-semibold transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                        >
                            <Save size={14} />
                            <span>Simpan Peran</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoleManagementPage;
