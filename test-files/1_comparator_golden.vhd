library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity comparator_vhdl is
    port (
        a, b : in std_logic_vector(1 downto 0);
        a_less_b : out std_logic;
        a_equal_b : out std_logic;
        a_greater_b : out std_logic
    );
end comparator_vhdl;

architecture comparator_structural of comparator_vhdl is
begin
    -- Use numeric_std for clean and efficient comparison logic
    a_less_b <= '1' when unsigned(a) < unsigned(b) else '0';
    a_equal_b <= '1' when unsigned(a) = unsigned(b) else '0';
    a_greater_b <= '1' when unsigned(a) > unsigned(b) else '0';
end comparator_structural;
