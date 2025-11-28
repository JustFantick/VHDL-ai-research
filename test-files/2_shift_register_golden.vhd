library ieee;
use ieee.std_logic_1164.all;

entity shift_registers_0 is
    generic(
        DEPTH : positive range 2 to 2048 := 32
    );
    port(
        clk : in std_logic;
        rst : in std_logic;
        clken : in std_logic;
        SI : in std_logic;
        SO : out std_logic
    );
end shift_registers_0;

architecture archi of shift_registers_0 is
    signal shreg : std_logic_vector(DEPTH - 1 downto 0);
begin
    process(clk, rst)
    begin
        if rst = '1' then
            shreg <= (others => '0');
        elsif rising_edge(clk) then
            if clken = '1' then
                shreg <= shreg(DEPTH - 2 downto 0) & SI;
            end if;
        end if;
    end process;
    
    SO <= shreg(DEPTH - 1);
end archi;
